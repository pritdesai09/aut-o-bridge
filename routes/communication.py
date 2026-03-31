from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import json

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/board", response_class=HTMLResponse)
async def communication_board(request: Request):
    # AAC board is FREE — no auth required
    lang = request.cookies.get("lang", "en")
    with open("data/aac_board.json", "r", encoding="utf-8") as f:
        board_data = json.load(f)
    return templates.TemplateResponse(request, "communication/board.html", {
        "lang": lang, "board_data": board_data
    })