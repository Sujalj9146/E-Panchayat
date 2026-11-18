"""The assistant answers precise questions directly, verdict first."""

from tests.conftest import API


def _ask(client, headers, query, language="en"):
    r = client.post(f"{API}/assistant/ask", headers=headers, json={"query": query, "language": language})
    assert r.status_code == 200, r.text
    return r.json()


def test_missing_documents_lists_what_to_upload_not_what_is_uploaded(client, citizen):
    for q in ("what docs am i missing", "what documents am I missing", "maza kagadpatra kay baki ahe"):
        body = _ask(client, citizen, q)
        assert body["mode"] == "retrieval_only_personal"
        assert "needs to upload" in body["answer"] or "No documents are missing" in body["answer"]
        # Not the old overview of projects and budgets.
        assert "development projects" not in body["answer"]


def test_missing_documents_skip_schemes_needing_review(client, citizen):
    body = _ask(client, citizen, "what documents am i missing")
    # Savita is 61; a girl's birth certificate for Lek Ladki is not her next step.
    assert "Girl's birth certificate" not in body["answer"]


def test_eligibility_for_a_named_resident_and_scheme(client, officer):
    body = _ask(client, officer, "Is Anandrao eligible for rural employment guarantee")
    text = body["answer"]
    assert text.startswith("**")
    assert "Anandrao Patil" in text and "Rural Employment Guarantee" in text
    assert any(w in text for w in ("Yes —", "Almost —", "No —", "Needs an officer"))
    assert "{'" not in text  # no raw criteria dictionaries
    assert body["mode"] == "retrieval_only_personal"


def test_scheme_aliases_are_understood(client, officer):
    for q in ("is anandrao eligible for mgnrega", "anandrao job card"):
        assert "Rural Employment Guarantee" in _ask(client, officer, q)["answer"]


def test_which_schemes_am_i_eligible_for(client, citizen):
    text = _ask(client, citizen, "which schemes am I eligible for")["answer"]
    assert "qualifies for" in text and "Eligible now" in text


def test_scheme_information_is_written_out(client, officer):
    body = _ask(client, officer, "what is ayushman bharat")
    assert body["mode"] == "direct"
    assert "Who can apply" in body["answer"] and "SECC-2011" in body["answer"]
    assert "{'" not in body["answer"]


def test_officer_can_ask_who_qualifies(client, officer):
    text = _ask(client, officer, "who is eligible for old age pension")["answer"]
    assert "Indira Gandhi National Old Age Pension Scheme" in text and "eligible" in text


def test_officer_can_list_residents(client, officer):
    text = _ask(client, officer, "List citizens")["answer"]
    assert "registered residents" in text and "Savita Patil" in text


def test_a_resident_cannot_ask_about_someone_else(client, citizen):
    text = _ask(client, citizen, "is sanjay eligible for pm kisan")["answer"]
    assert "only ask about your own record" in text


def test_a_scheme_named_after_a_person_is_not_mistaken_for_a_resident(client, citizen):
    text = _ask(client, citizen, "am I eligible for sanjay gandhi niradhar")["answer"]
    assert "Sanjay Gandhi Niradhar" in text and "only ask about your own record" not in text


def test_marathi_question_gets_marathi_answer(client, citizen):
    text = _ask(client, citizen, "माझी कोणती कागदपत्रे बाकी आहेत", "mr")["answer"]
    assert "अपलोड" in text or "बाकी नाही" in text


def test_open_questions_still_use_the_general_path(client, officer):
    body = _ask(client, officer, "how many projects are delayed")
    assert body["mode"] in ("retrieval_only", "llm", "unavailable")
