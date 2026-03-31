from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/board", response_class=HTMLResponse)
async def communication_board(request: Request):
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "communication/board.html", {
        "lang": lang
    })