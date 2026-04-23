from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.services.whatsapp import WhatsappService

router = APIRouter()


class SendMessageRequest(BaseModel):
    number: str
    text: str


@router.post("/send")
async def send_message(request: SendMessageRequest):
    response_data = await WhatsappService.send_message(
        number=request.number, text=request.text
    )
    return {"status": "success", "data": response_data}


@router.get("/screenshot")
async def get_screenshot():
    """Get the WhatsApp Web screenshot as an image."""
    image_bytes = await WhatsappService.get_screenshot()
    return Response(content=image_bytes, media_type="image/jpeg")


@router.get("/qr")
async def get_qr_code():
    """Get the WhatsApp authentication QR code as an image."""
    image_bytes = await WhatsappService.get_qr_code()
    return Response(content=image_bytes, media_type="image/png")

@router.post("/restart")
async def restart_session(session: str = "default"):
    """Restart the WhatsApp session."""
    response_data = await WhatsappService.restart_session(session)
    return {"status": "success", "data": response_data}


@router.post("/logout")
async def logout_session(session: str = "default"):
    """Logout the WhatsApp session."""
    response_data = await WhatsappService.logout_session(session)
    return {"status": "success", "data": response_data}


@router.get("/session")
async def get_session_info(session: str = "default"):
    """Get the current session info."""
    data_bytes = await WhatsappService.get_session_info(session)
    return Response(content=data_bytes, media_type="application/json")


@router.get("/me")
async def get_me(session: str = "default"):
    """Get current user info."""
    data_bytes = await WhatsappService.get_me(session)
    return Response(content=data_bytes, media_type="application/json")
