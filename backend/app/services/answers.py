"""Direct answers to the questions people actually ask the assistant.

The retrieval path collects records and either hands them to a model or lists
them. That works for open questions ("which projects are delayed?") and fails
for precise ones, which are most of what residents and officers ask:

    "what documents am I missing"        -> listed the documents already uploaded
    "is Poornima eligible for MGNREGA"   -> listed eight other schemes' raw rules

Both have one correct answer, and the eligibility engine already computes it:
for any resident and scheme it knows which rules failed, which documents are
missing and which are awaiting verification. This module recognises those
questions, asks the engine, and writes the answer — verdict first, then the
reason, then what to do next.

No model is involved here, by design. These answers turn on one resident's
income, social category and documents, which never leave this server (see
`api.routes.assistant`), and a welfare decision has to be reproducible: the
same question must get the same answer, traceable to the rule that produced it.

`answer()` returns None for anything it does not recognise, and the normal
retrieval path takes over.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Citizen, Scheme, User
from app.services import eligibility as elig
from app.services.retrieval import Source


@dataclass
class Direct:
    text: str
    sources: list[Source] = field(default_factory=list)
    # True when the answer describes an identified resident. Decides the badge
    # and, more importantly, that it must never be sent to a model.
    personal: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Recognising the question
# ─────────────────────────────────────────────────────────────────────────────

DOC_WORDS = (
    "doc", "docs", "document", "documents", "paper", "papers", "paperwork",
    "certificate", "certificates", "proof", "proofs",
    "kagad", "kagadpatra", "kagadpatre", "dastavej", "dakhla",
    "कागद", "कागदपत्र", "कागदपत्रे", "दस्तऐवज", "दाखला", "दाखले", "पुरावा",
)
MISSING_WORDS = (
    "missing", "need", "needed", "needs", "require", "required", "requirement",
    "pending", "lack", "lacking", "upload", "submit", "short", "left", "remaining",
    "incomplete", "which", "what",
    "baki", "pahije", "lagtil", "lagel", "kami", "konte", "konti", "kay",
    "बाकी", "हवे", "हवी", "लागतील", "लागेल", "आवश्यक", "कमी", "अपूर्ण", "कोणती", "कोणते",
)
ELIG_WORDS = (
    "eligible", "eligibility", "qualify", "qualifies", "qualified", "entitled",
    "can i get", "can i apply", "can she", "can he", "do i get", "will i get",
    "apply for", "get benefit", "benefit for me", "suitable",
    "patra", "patrata", "milel ka",
    "पात्र", "पात्रता", "लाभ मिळेल", "मिळेल का", "अर्ज करू",
)
SCHEME_WORDS = ("scheme", "schemes", "yojana", "yojna", "योजना", "योजनांसाठी")
INFO_WORDS = (
    "what is", "what's", "tell me about", "explain", "details", "benefit",
    "benefits", "criteria", "who can", "who is eligible", "how to apply",
    "how do i apply", "documents required", "required documents", "about",
    "काय आहे", "माहिती", "निकष", "कोण पात्र", "अर्ज कसा",
)
LIST_WORDS = ("list", "show", "all", "names", "who are", "यादी", "सर्व", "दाखवा")
RESIDENT_WORDS = ("citizen", "citizens", "resident", "residents", "villagers", "people", "नागरिक", "रहिवासी")
SELF_WORDS = (" i ", " me ", " my ", " mine ", " am i ", "मी", "माझ", "मला")

# Ways people name a scheme that its official title does not contain.
SCHEME_ALIASES: dict[str, tuple[str, ...]] = {
    "scheme_rural_employment_guarantee": (
        "mgnrega", "mnrega", "nrega", "narega", "rural employment", "employment guarantee",
        "job card", "100 days work", "रोजगार हमी", "मनरेगा",
    ),
    "scheme_pm_kisan": ("pm kisan", "pmkisan", "kisan samman", "farmer 6000", "किसान सन्मान"),
    "scheme_ab_pmjay": ("ayushman", "pmjay", "pm jay", "ayushman card", "golden card", "आयुष्मान"),
    "scheme_mjpjay": ("mjpjay", "phule jan arogya", "jyotirao phule", "ज्योतिबा फुले"),
    "scheme_pmuy": ("ujjwala", "gas connection", "lpg", "free gas", "उज्ज्वला", "गॅस"),
    "scheme_sbm_g": ("swachh bharat", "toilet", "sbm", "शौचालय", "स्वच्छ भारत"),
    "scheme_pmfby": ("fasal bima", "crop insurance", "pmfby", "पीक विमा"),
    "scheme_pmay_g": ("pmay", "pm awas", "awas gramin", "pradhan mantri awas", "घरकुल"),
    "scheme_ignoaps": ("old age pension", "vridhapkal", "वृद्धापकाळ", "वृद्ध पेन्शन"),
    "scheme_ignwps": ("widow pension", "विधवा"),
    "scheme_widow_pension": ("widow pension", "विधवा"),
    "scheme_igndps": ("disability pension", "divyang pension", "अपंग पेन्शन", "दिव्यांग"),
    "scheme_disability_pension": ("disability pension", "divyang pension", "अपंग पेन्शन", "दिव्यांग"),
    "scheme_ssy": ("sukanya", "सुकन्या"),
    "scheme_pmmvy": ("matru vandana", "maternity benefit", "pmmvy", "मातृ वंदना"),
    "scheme_saur_krushi_pump": ("solar pump", "saur pump", "saur krushi", "सौर पंप"),
    "scheme_lek_ladki": ("lek ladki", "लेक लाडकी"),
    "scheme_sanjay_gandhi_niradhar": ("sanjay gandhi", "niradhar", "संजय गांधी", "निराधार"),
    "scheme_shravanbal_nivruttivetan": ("shravan bal", "shravanbal", "श्रावणबाळ"),
    "scheme_nfbs": ("family benefit", "nfbs"),
    "scheme_nmmss": ("nmmss", "means cum merit", "means-cum-merit"),
    "scheme_ebc_shikshan_shulk": ("ebc", "shikshan shulk", "fee reimbursement", "शिक्षण शुल्क"),
    "scheme_post_matric_sc": ("post matric", "post-matric"),
    "scheme_birsa_munda_krishi_kranti": ("birsa munda", "बिरसा मुंडा"),
    "scheme_ramai_awas": ("ramai", "रमाई"),
    "scheme_shabari_awas": ("shabari", "शबरी"),
    "scheme_pmjjby": ("jeevan jyoti", "pmjjby", "life insurance", "जीवन ज्योती"),
    "scheme_mukhyamantri_majhi_ladki_bahin": ("ladki bahin", "लाडकी बहीण"),
}

# Words in scheme titles that say nothing about which scheme is meant.
_SCHEME_STOP = {
    "yojana", "scheme", "pradhan", "mantri", "national", "maharashtra", "government",
    "of", "for", "the", "and", "india", "top", "up", "top-up", "programme", "successor",
    "rajya", "mukhyamantri", "gramin", "indira", "gandhi", "students", "household",
    "incentive", "seva",
}


def _norm(text: str) -> str:
    text = text.lower().replace("-", " ").replace("/", " ")
    return " " + re.sub(r"[^\wऀ-ॿ]+", " ", text).strip() + " "


def _has(text: str, words) -> bool:
    return any(_norm(w) in text for w in words)


def _match_schemes(text: str, schemes: list[Scheme]) -> list[Scheme]:
    """The scheme(s) a question names, best first. Several only on a real tie,
    e.g. 'widow pension' names both the central scheme and the state top-up."""
    scored: list[tuple[float, Scheme]] = []
    for s in schemes:
        score = 0.0
        if any(_norm(a) in text for a in SCHEME_ALIASES.get(s.id, ())):
            score = 3.0
        # Acronyms the title carries in brackets: (PM-KISAN), (MGNREGA ...), (EBC).
        for acr in re.findall(r"\(([^)]+)\)", s.name):
            for part in re.split(r"[/,]", acr):
                if len(part.strip()) >= 3 and _norm(part) in text:
                    score = max(score, 3.0)
        if _norm(s.name) in text or (s.name_mr and _norm(s.name_mr) in text):
            score = 4.0
        if score == 0:
            tokens = [t for t in _norm(s.name).split() if t not in _SCHEME_STOP and len(t) > 2]
            hits = [t for t in tokens if f" {t} " in text]
            if tokens and (len(hits) >= 2 or (len(hits) == 1 and len(tokens) == 1)):
                score = len(hits) / len(tokens) + 0.5 * len(hits)
        if score:
            scored.append((score, s))
    if not scored:
        return []
    scored.sort(key=lambda x: x[0], reverse=True)
    best = scored[0][0]
    return [s for sc, s in scored if sc >= best][:3]


def _strip_scheme_words(text: str, schemes: list[Scheme]) -> str:
    """Remove a matched scheme's words, so 'Sanjay Gandhi Niradhar' is not
    mistaken for the resident Sanjay Patil."""
    for s in schemes:
        for phrase in (s.name, s.name_mr or "", *SCHEME_ALIASES.get(s.id, ())):
            for tok in _norm(phrase).split():
                text = text.replace(f" {tok} ", " ")
    return text


def _match_residents(text: str, residents: list[Citizen]) -> list[Citizen]:
    full = [c for c in residents if _norm(c.name) in text or (c.name_mr and _norm(c.name_mr) in text)]
    # A full-name match on a multi-word name is unambiguous. A one-word name
    # ("Poornima") is also every Poornima's first name, so it is not.
    # "Poornima Rayavarapu" contains the one-word name "Poornima", so when a
    # multi-word name matches in full it wins over any one-word match.
    multi = [c for c in full if len(_norm(c.name).split()) > 1]
    if multi:
        return multi
    first = []
    for c in residents:
        given = _norm(c.name).split()
        given_mr = _norm(c.name_mr).split() if c.name_mr else []
        if (given and len(given[0]) >= 3 and f" {given[0]} " in text) or (
            given_mr and f" {given_mr[0]} " in text
        ):
            first.append(c)
    return first


# ─────────────────────────────────────────────────────────────────────────────
# Writing the answer
# ─────────────────────────────────────────────────────────────────────────────

def _rs(v) -> str:
    return f"Rs {float(v or 0):,.0f}"


def _sname(s: Scheme, mr: bool) -> str:
    return (s.name_mr or s.name) if mr else s.name


def _cname(c: Citizen, mr: bool) -> str:
    return (c.name_mr or c.name) if mr else c.name


def describe_criteria(criteria: dict, mr: bool = False) -> list[str]:
    """A scheme's rules in words a resident can read, instead of the raw
    dictionary the old answers printed."""
    out: list[str] = []
    c = criteria or {}
    lo, hi = c.get("min_age"), c.get("max_age")
    if lo is not None and hi is not None:
        out.append(f"वय {lo}–{hi} वर्षे" if mr else f"Age {lo} to {hi}")
    elif lo is not None:
        out.append(f"वय किमान {lo} वर्षे" if mr else f"Age {lo} or above")
    elif hi is not None:
        out.append(f"वय कमाल {hi} वर्षे" if mr else f"Age up to {hi}")
    if c.get("max_income") is not None:
        out.append(
            f"वार्षिक कौटुंबिक उत्पन्न {_rs(c['max_income'])} पेक्षा कमी"
            if mr else f"Annual family income up to {_rs(c['max_income'])}"
        )
    if c.get("min_income") is not None:
        out.append(f"उत्पन्न किमान {_rs(c['min_income'])}" if mr else f"Income at least {_rs(c['min_income'])}")
    if c.get("gender"):
        g = c["gender"]
        out.append(({"Female": "महिला", "Male": "पुरुष"}.get(g, g)) if mr else f"{g} applicants only")
    if c.get("marital_status_any"):
        out.append(("वैवाहिक स्थिती: " if mr else "Marital status: ") + ", ".join(c["marital_status_any"]))
    if c.get("category_any"):
        out.append(("सामाजिक प्रवर्ग: " if mr else "Social category: ") + ", ".join(c["category_any"]))
    if c.get("requires_bpl"):
        out.append("दारिद्र्यरेषेखालील (BPL) यादीत नाव" if mr else "Must be on the BPL list")
    if c.get("requires_secc_listed"):
        out.append("SECC-2011 यादीत नाव" if mr else "Must be listed in SECC-2011")
    if c.get("ration_card_any"):
        out.append(("शिधापत्रिका: " if mr else "Ration card: ") + ", ".join(c["ration_card_any"]))
    if c.get("min_land_hectares") is not None:
        out.append(f"जमीन किमान {c['min_land_hectares']} हेक्टर" if mr else f"Land holding at least {c['min_land_hectares']} hectares")
    if c.get("max_land_hectares") is not None:
        out.append(f"जमीन कमाल {c['max_land_hectares']} हेक्टर" if mr else f"Land holding up to {c['max_land_hectares']} hectares")
    if c.get("occupation_any"):
        out.append(("व्यवसाय: " if mr else "Occupation: ") + ", ".join(c["occupation_any"]))
    if c.get("occupation_none"):
        out.append(("व्यवसाय नसावा: " if mr else "Not for: ") + ", ".join(c["occupation_none"]))
    if c.get("min_disability_percent") is not None:
        out.append(
            f"किमान {c['min_disability_percent']}% अपंगत्व" if mr
            else f"Disability of at least {c['min_disability_percent']}%"
        )
    if c.get("is_head"):
        out.append("कुटुंबप्रमुख" if mr else "Head of the household")
    if c.get("ward_in"):
        out.append(("वॉर्ड: " if mr else "Wards: ") + ", ".join(map(str, c["ward_in"])))
    if c.get("any_of"):
        options = ["; ".join(describe_criteria(o, mr)) for o in c["any_of"]]
        options = [o for o in options if o]
        if options:
            out.append(("यापैकी कोणतेही एक: " if mr else "Any one of: ") + " OR ".join(f"({o})" for o in options))
    if c.get("manual_review"):
        note = c["manual_review"] if isinstance(c["manual_review"], str) else ""
        out.append(
            ("अधिकाऱ्याची पडताळणी आवश्यक" if mr else "An officer must verify")
            + (f": {note}" if note else "")
        )
    return out


def _docs(scheme: Scheme, mr: bool) -> list[str]:
    names = []
    for d in scheme.required_documents or []:
        n = (d.get("name_mr") or d.get("nameMr") or d.get("name")) if mr else d.get("name")
        if n:
            names.append(n)
    return names


def _next_step(a: elig.Assessment, is_citizen: bool, mr: bool) -> str:
    s = a.status
    if s == "Eligible":
        url = a.scheme.form_url
        if mr:
            return "पुढचे पाऊल: ग्रामपंचायत कार्यालयात अर्ज करा" + (f" किंवा ऑनलाइन: {url}" if url else "") + "."
        return "Next step: apply at the Gram Panchayat office" + (f", or online at {url}" if url else "") + "."
    if s == "Missing Documents":
        if is_citizen:
            return (
                "पुढचे पाऊल: ही कागदपत्रे 'डिजिटल लॉकर' पानावरून अपलोड करा; अधिकारी पडताळणी करतील."
                if mr else
                "Next step: upload these from the Digital Locker page; an officer will then verify them."
            )
        return (
            "पुढचे पाऊल: रहिवाशाला ही कागदपत्रे अपलोड करण्यास सांगा, किंवा प्रलंबित कागदपत्रांची पडताळणी करा."
            if mr else
            "Next step: ask the resident to upload these, or verify the ones already pending."
        )
    if s == "Needs Review":
        return (
            "पुढचे पाऊल: अधिकाऱ्याने नोंद पूर्ण करून पडताळणी करावी."
            if mr else "Next step: an officer needs to complete the record and verify."
        )
    return ""


def _verdict(a: elig.Assessment, is_citizen: bool, mr: bool) -> list[str]:
    name, scheme = _cname(a.citizen, mr), _sname(a.scheme, mr)
    lines: list[str] = []
    s = a.status
    if s == "Eligible":
        lines.append(f"**होय — {name} {scheme} साठी पात्र आहेत.**" if mr else f"**Yes — {name} is eligible for {scheme}.**")
        lines.append("सर्व निकष पूर्ण आहेत आणि सर्व आवश्यक कागदपत्रांची पडताळणी झाली आहे." if mr
                     else "Every rule is met and all required documents are verified.")
    elif s == "Missing Documents":
        lines.append(
            f"**जवळजवळ — {name} {scheme} चे सर्व निकष पूर्ण करतात, पण कागदपत्रे अपूर्ण आहेत.**" if mr
            else f"**Almost — {name} meets every rule for {scheme}, but the documents are incomplete.**"
        )
        for d in a.missing_documents:
            lines.append(f"- {'अपलोड करायचे' if mr else 'Upload'}: **{(d.name_mr or d.name) if mr else d.name}**")
        for d in a.unverified_documents:
            lines.append(
                f"- {'पडताळणी बाकी' if mr else 'Awaiting verification'}: "
                f"**{(d.name_mr or d.name) if mr else d.name}** ({d.file_status})"
            )
    elif s == "Needs Review":
        lines.append(
            f"**अधिकाऱ्याची तपासणी आवश्यक — {name} आणि {scheme}.**" if mr
            else f"**Needs an officer's check — {name} for {scheme}.**"
        )
        lines.append(elig.explain(a, "mr" if mr else "en"))
    else:
        lines.append(f"**नाही — {name} {scheme} साठी पात्र नाहीत.**" if mr else f"**No — {name} is not eligible for {scheme}.**")
        for r in (a.failed_criteria_mr if mr else a.failed_criteria) or []:
            lines.append(f"- {r}")
    benefit = a.scheme.benefit_mr if mr and a.scheme.benefit_mr else a.scheme.benefit
    if benefit and s != "Ineligible":
        lines.append(f"{'लाभ' if mr else 'Benefit'}: {benefit}")
    step = _next_step(a, is_citizen, mr)
    if step:
        lines.append(step)
    return lines


def _assess_all(citizen: Citizen, schemes: list[Scheme]) -> list[elig.Assessment]:
    docs = list(citizen.documents)
    return [elig.assess(citizen, s, docs) for s in schemes]


def _overview(citizen: Citizen, schemes: list[Scheme], is_citizen: bool, mr: bool) -> list[str]:
    results = _assess_all(citizen, schemes)
    by = {k: [a for a in results if a.status == k] for k in elig.STATUS_ORDER}
    name = _cname(citizen, mr)
    lines = [
        f"**{name} आत्ता {len(by['Eligible'])} योजनांसाठी पात्र आहेत, आणि कागदपत्रे पूर्ण केल्यावर "
        f"आणखी {len(by['Missing Documents'])} योजनांसाठी पात्र होतील.**"
        if mr else
        f"**{name} qualifies for {len(by['Eligible'])} scheme(s) now, and {len(by['Missing Documents'])} "
        f"more once the documents are complete.**"
    ]
    if by["Eligible"]:
        lines.append("आत्ता पात्र:" if mr else "Eligible now:")
        lines += [f"- {_sname(a.scheme, mr)}" for a in by["Eligible"]]
    if by["Missing Documents"]:
        lines.append("कागदपत्रे बाकी:" if mr else "Eligible once documents are complete:")
        for a in by["Missing Documents"]:
            need = [(d.name_mr or d.name) if mr else d.name for d in a.missing_documents]
            wait = [(d.name_mr or d.name) if mr else d.name for d in a.unverified_documents]
            bits = []
            if need:
                bits.append(("अपलोड: " if mr else "upload ") + ", ".join(need))
            if wait:
                bits.append(("पडताळणी बाकी: " if mr else "awaiting verification: ") + ", ".join(wait))
            lines.append(f"- {_sname(a.scheme, mr)} — {'; '.join(bits)}")
    if by["Needs Review"]:
        lines.append("अधिकाऱ्याची तपासणी आवश्यक:" if mr else "Needs an officer's check:")
        lines += [f"- {_sname(a.scheme, mr)}" for a in by["Needs Review"]]
    lines.append(
        f"उर्वरित {len(by['Ineligible'])} योजनांचे निकष पूर्ण होत नाहीत."
        if mr else f"The other {len(by['Ineligible'])} scheme(s) do not match {name}'s record."
    )
    if by["Missing Documents"]:
        lines.append(_next_step(by["Missing Documents"][0], is_citizen, mr))
    return lines


def _missing_documents(
    citizen: Citizen, schemes: list[Scheme], is_citizen: bool, mr: bool
) -> list[str]:
    results = _assess_all(citizen, schemes)
    need: dict[str, list[str]] = {}
    wait: dict[str, tuple[str, list[str]]] = {}
    review = [a for a in results if a.status == "Needs Review"]
    for a in results:
        # Only schemes whose rules are fully met. Documents cannot help with a
        # scheme whose rules fail, and for one that needs an officer's review
        # (an attribute the record lacks) they would be premature — listing
        # them told a 61-year-old to upload a girl's birth certificate.
        if a.status != "Missing Documents":
            continue
        for d in a.missing_documents:
            key = (d.name_mr or d.name) if mr else d.name
            need.setdefault(key, []).append(_sname(a.scheme, mr))
        for d in a.unverified_documents:
            key = (d.name_mr or d.name) if mr else d.name
            wait.setdefault(key, (d.file_status or "", []))[1].append(_sname(a.scheme, mr))

    name = _cname(citizen, mr)
    # One entry per document type, keeping the best status on file.
    rank = {"Verified": 0, "Pending Verification": 1}
    best: dict[str, str] = {}
    for d in citizen.documents:
        key = d.doc_type.strip()
        prev = next((k for k in best if k.lower() == key.lower()), None)
        if prev is None or rank.get(d.status, 2) < rank.get(best[prev], 2):
            if prev is not None:
                del best[prev]
            best[key] = d.status
    have = [f"{t} ({s})" for t, s in best.items()]
    lines: list[str] = []
    if not need and not wait:
        lines.append(
            f"**{name} यांच्या पात्र योजनांसाठी कोणतेही कागदपत्र बाकी नाही.**" if mr
            else f"**No documents are missing for any scheme {name} qualifies for.**"
        )
    else:
        if need:
            lines.append(
                f"**{name} यांनी ही {len(need)} कागदपत्रे अपलोड करायची आहेत:**" if mr
                else f"**{name} needs to upload {len(need)} document(s):**"
            )
            for doc, used_by in sorted(need.items(), key=lambda kv: -len(kv[1])):
                lines.append(f"- **{doc}** — {'यासाठी' if mr else 'needed for'} {', '.join(used_by)}")
        if wait:
            lines.append("अपलोड झालेली पण पडताळणी बाकी:" if mr else "Uploaded, awaiting officer verification:")
            for doc, (status, used_by) in wait.items():
                lines.append(f"- **{doc}** ({status}) — {'यासाठी' if mr else 'for'} {', '.join(used_by)}")
    if have:
        lines.append(("आधीच फाईलमध्ये: " if mr else "Already in the file: ") + ", ".join(have))
    if review:
        lines.append(
            f"आणखी {len(review)} योजनांसाठी आधी अधिकाऱ्याची तपासणी आवश्यक आहे: "
            + ", ".join(_sname(a.scheme, mr) for a in review) + "."
            if mr else
            f"{len(review)} more scheme(s) need an officer's check before documents matter: "
            + ", ".join(_sname(a.scheme, mr) for a in review) + "."
        )
    lines.append(
        "ज्या योजनांचे निकष पूर्ण होत नाहीत त्यांच्या कागदपत्रांचा यात समावेश नाही."
        if mr else "Documents for schemes whose rules are not met are not listed — uploading them would not help."
    )
    if need:
        lines.append(
            "पुढचे पाऊल: 'डिजिटल लॉकर' पानावरून अपलोड करा." if mr and is_citizen
            else "Next step: upload them from the Digital Locker page." if is_citizen
            else "पुढचे पाऊल: रहिवाशाला ही कागदपत्रे अपलोड करण्यास सांगा." if mr
            else "Next step: ask the resident to upload these."
        )
    return lines


def _scheme_info(s: Scheme, mr: bool) -> list[str]:
    lines = [f"**{_sname(s, mr)}** ({s.level}{', ' + s.category if s.category else ''})"]
    benefit = s.benefit_mr if mr and s.benefit_mr else s.benefit
    if benefit:
        lines.append(f"{'लाभ' if mr else 'Benefit'}: {benefit}")
    rules = describe_criteria(s.criteria or {}, mr)
    if rules:
        lines.append("कोण अर्ज करू शकतो:" if mr else "Who can apply:")
        lines += [f"- {r}" for r in rules]
    docs = _docs(s, mr)
    if docs:
        lines.append("आवश्यक कागदपत्रे:" if mr else "Documents required:")
        lines += [f"- {d}" for d in docs]
    if s.form_url:
        lines.append(f"{'अर्ज' if mr else 'Apply'}: {s.form_url}")
    return lines


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def answer(
    db: Session, question: str, user: User, village_id: str | None, language: str = "en"
) -> Direct | None:
    mr = language == "mr"
    text = _norm(question)
    is_citizen = user.role == "citizen"

    schemes = list(db.scalars(select(Scheme).where(Scheme.status == "active").order_by(Scheme.name)))
    named_schemes = _match_schemes(text, schemes)

    residents: list[Citizen] = []
    stmt = select(Citizen).options(selectinload(Citizen.documents))
    if village_id:
        stmt = stmt.where(Citizen.village_id == village_id)
    residents = list(db.scalars(stmt.order_by(Citizen.ward, Citizen.name)))
    named = _match_residents(_strip_scheme_words(text, named_schemes), residents)

    asks_docs = _has(text, DOC_WORDS) and _has(text, MISSING_WORDS)
    asks_elig = _has(text, ELIG_WORDS) or (_has(text, SCHEME_WORDS) and _has(text, ("which", "what", "my", "me", "कोणत्या", "माझ्या")))
    asks_info = bool(named_schemes) and _has(text, INFO_WORDS)
    asks_list = _has(text, LIST_WORDS) and _has(text, RESIDENT_WORDS)

    # ── Whose record ─────────────────────────────────────────────────────────
    subject: Citizen | None = None
    if is_citizen:
        me = next((c for c in residents if c.id == user.citizen_id), None)
        others = [c for c in named if c.id != user.citizen_id]
        if others and not any(c.id == user.citizen_id for c in named) and (asks_docs or asks_elig):
            return Direct(
                "तुम्ही फक्त तुमच्या स्वतःच्या नोंदीबद्दल विचारू शकता. इतर रहिवाशांची माहिती "
                "ग्रामपंचायत कार्यालयातच मिळते."
                if mr else
                "You can only ask about your own record. Another resident's details are "
                "available only from the Gram Panchayat office.",
            )
        subject = me
    elif len(named) == 1:
        subject = named[0]
    elif len(named) > 1 and (asks_docs or asks_elig):
        options = ", ".join(f"{c.name} (ward {c.ward})" for c in named[:6])
        return Direct(
            (f"कोणत्या रहिवाशाबद्दल विचारत आहात? {options}" if mr
             else f"Which resident do you mean? {options}. Ask again with the full name."),
            personal=True,
        )

    sources = []
    if subject:
        sources.append(Source("citizen", subject.id, subject.name))
    for s in named_schemes:
        sources.append(Source("scheme", s.id, s.name))

    # ── Missing documents ────────────────────────────────────────────────────
    if asks_docs and subject:
        scope = named_schemes or schemes
        return Direct("\n".join(_missing_documents(subject, scope, is_citizen, mr)), sources, personal=True)

    # ── One resident, one or more named schemes ─────────────────────────────
    if subject and named_schemes and (asks_elig or not asks_info):
        lines: list[str] = []
        for s in named_schemes:
            a = elig.assess(subject, s, list(subject.documents))
            if lines:
                lines.append("")
            lines += _verdict(a, is_citizen, mr)
        return Direct("\n".join(lines), sources, personal=True)

    # ── One resident, which schemes ─────────────────────────────────────────
    if subject and asks_elig:
        return Direct("\n".join(_overview(subject, schemes, is_citizen, mr)), sources, personal=True)

    # ── Officer: who in the village qualifies for a scheme ──────────────────
    if not is_citizen and named_schemes and asks_elig and not named:
        s = named_schemes[0]
        results = [elig.assess(c, s, list(c.documents)) for c in residents]
        ok = [a for a in results if a.status == "Eligible"]
        near = [a for a in results if a.status == "Missing Documents"]
        review = [a for a in results if a.status == "Needs Review"]
        lines = [
            f"**{_sname(s, mr)}: {len(ok)} पात्र, {len(near)} कागदपत्रे बाकी, {len(review)} तपासणी आवश्यक "
            f"({len(residents)} रहिवाशांपैकी).**" if mr else
            f"**{_sname(s, mr)}: {len(ok)} eligible, {len(near)} need documents, {len(review)} need review "
            f"(out of {len(residents)} residents).**"
        ]
        if ok:
            lines.append("पात्र:" if mr else "Eligible:")
            lines += [f"- {_cname(a.citizen, mr)} ({'वॉर्ड' if mr else 'ward'} {a.citizen.ward})" for a in ok]
        if near:
            lines.append("कागदपत्रे पूर्ण झाल्यावर पात्र:" if mr else "Eligible once documents are complete:")
            for a in near:
                docs = [(d.name_mr or d.name) if mr else d.name for d in a.missing_documents + a.unverified_documents]
                lines.append(f"- {_cname(a.citizen, mr)} — {', '.join(docs)}")
        if review:
            lines.append("तपासणी आवश्यक:" if mr else "Needs an officer's check:")
            lines += [f"- {_cname(a.citizen, mr)}" for a in review]
        return Direct("\n".join(lines), sources, personal=True)

    # ── What a scheme is ────────────────────────────────────────────────────
    if named_schemes and (asks_info or (not subject and not asks_docs)):
        lines: list[str] = []
        for s in named_schemes:
            if lines:
                lines.append("")
            lines += _scheme_info(s, mr)
        return Direct("\n".join(lines), sources, personal=False)

    # ── Officer: list residents ─────────────────────────────────────────────
    if not is_citizen and asks_list:
        lines = [
            f"**{len(residents)} नोंदणीकृत रहिवासी:**" if mr else f"**{len(residents)} registered residents:**"
        ]
        for c in residents[:60]:
            lines.append(
                f"- {_cname(c, mr)} — {'वॉर्ड' if mr else 'ward'} {c.ward}, "
                f"{'वय' if mr else 'age'} {c.age}, {c.gender_mr if mr else c.gender}, "
                f"{c.occupation_mr if mr else c.occupation}"
            )
        if len(residents) > 60:
            lines.append(f"…and {len(residents) - 60} more." if not mr else f"…आणखी {len(residents) - 60}.")
        return Direct("\n".join(lines), [Source("citizen", c.id, c.name) for c in residents[:10]], personal=True)

    return None
