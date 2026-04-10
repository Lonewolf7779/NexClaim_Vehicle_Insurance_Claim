from fastapi import FastAPI, APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    policy_id: int

@app.post('/')
def f(item: Item):
    return item

client = TestClient(app)
print(client.post('/', json={'policy_id': 'POL1001'}).json())
