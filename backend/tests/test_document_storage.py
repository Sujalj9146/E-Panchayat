"""Uploaded documents live in the database, so a redeploy cannot lose them."""

from app.db.session import SessionLocal
from app.models import CitizenDocument
from tests.conftest import API

PDF = b"%PDF-1.4\n% test file\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def test_upload_is_stored_in_the_database_and_downloads_intact(client, citizen):
    r = client.post(
        f"{API}/documents", headers=citizen,
        data={"citizenId": "cit_102", "docType": "Voter ID"},
        files={"file": ("मतदार ओळखपत्र.pdf", PDF, "application/pdf")},
    )
    assert r.status_code == 201, r.text
    doc_id = r.json()["id"]
    with SessionLocal() as db:
        doc = db.get(CitizenDocument, doc_id)
        assert doc.storage_path is None  # nothing on the server's disk
        assert doc.file_data == PDF

    got = client.get(f"{API}/documents/{doc_id}/file", headers=citizen)
    assert got.status_code == 200
    assert got.content == PDF
    assert got.headers["content-type"] == "application/pdf"
    assert "filename*=UTF-8''" in got.headers["content-disposition"]

    with SessionLocal() as db:
        db.delete(db.get(CitizenDocument, doc_id))
        db.commit()
