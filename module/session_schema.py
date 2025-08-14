from beanie import Document


class SessionRequest(Document):
    username: str
    collection: str
    session_id: str
