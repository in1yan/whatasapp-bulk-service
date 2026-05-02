import httpx
from fastapi import HTTPException

from app.core.config import settings


class WhatsappService:
    @classmethod
    async def get_screenshot(cls, session: str = "default") -> bytes:
        headers = {"accept": "image/jpeg"}
        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.WAHA_URL}/screenshot",
                    params={"session": session},
                    headers=headers,
                    timeout=60.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            detail = f"Failed to get screenshot: {str(e)}"
            if hasattr(e, "response") and e.response is not None:
                detail += f" - {e.response.text}"
            raise HTTPException(status_code=500, detail=detail)

    @classmethod
    async def get_qr_code(cls, session: str = "default") -> bytes:
        headers = {"accept": "image/png"}
        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.WAHA_URL}/{session}/auth/qr",
                    params={"format": "image"},
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            detail = f"Failed to get QR code: {str(e)}"
            if hasattr(e, "response") and e.response is not None:
                detail += f" - {e.response.text}"
            raise HTTPException(status_code=500, detail=detail)

    @classmethod
    async def check_number_exists(cls, number: str, session: str = "default") -> bool:
        headers = {"accept": "application/json"}
        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY
            
        # Remove @c.us if present for the check-exists endpoint
        phone = number.replace("@c.us", "")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.WAHA_URL}/contacts/check-exists",
                    params={"phone": phone, "session": session},
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("numberExists", False)
        except httpx.HTTPError as e:
            print(f"Failed to check if number exists: {e}")
            # If the check fails, we might still want to try sending, 
            # or we can assume it fails. Let's return True to allow sending attempt
            # so we don't block legitimate messages if the check API is acting up.
            return True

    @classmethod
    async def send_typing(cls, number: str) -> dict:
        chat_id = number
        if not chat_id.endswith("@c.us"):
            chat_id = f"{chat_id}@c.us"

        payload = {"chatId": chat_id, "session": "default"}
        headers = {"accept": "application/json", "Content-Type": "application/json"}

        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.WAHA_URL}/startTyping",
                    json=payload,
                    headers=headers,
                    timeout=5.0,  # Shorter timeout for typing indicator
                )
                response.raise_for_status()
                return {"status": "success"}
        except httpx.HTTPError as e:
            # We don't want a typing indicator failure to block the actual message
            print(f"Failed to send typing indicator: {e}")
            return {"status": "error"}

    @classmethod
    async def send_message(cls, number: str, text: str) -> dict:
        chat_id = number
        if not chat_id.endswith("@c.us"):
            chat_id = f"{chat_id}@c.us"

        payload = {"chatId": chat_id, "text": text, "session": "default"}

        headers = {"accept": "application/json", "Content-Type": "application/json"}

        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY

        try:
            # Await the typing indicator
            await cls.send_typing(number)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.WAHA_URL}/sendText",
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()

                try:
                    response_data = response.json()
                except ValueError:
                    response_data = response.text

                return response_data
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to send message: {str(e)}"
            )

    @classmethod
    async def restart_session(cls, session: str) -> dict:
        # payload = {"chatId": chat_id, "session": "default"}
        headers = {"accept": "application/json", "Content-Type": "application/json"}

        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.WAHA_URL}/sessions/{session}/restart",
                    # json=payload,
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
                return {"status": "success"}
        except httpx.HTTPError as e:
            print(f"Failed to restart the session: {e}")
            return {"status": "error"}

    @classmethod
    async def logout_session(cls, session: str) -> dict:
        headers = {"accept": "application/json", "Content-Type": "application/json"}

        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.WAHA_URL}/sessions/{session}/logout",
                    # json=payload,
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
                return {"status": "success"}
        except httpx.HTTPError as e:
            print(f"Failed to logout the session: {e}")
            return {"status": "error"}

    @classmethod
    async def get_session_info(cls, session: str = "default") -> bytes:
        headers = {"accept": "application/json", "Content-Type": "application/json"}
        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.WAHA_URL}/sessions/{session}",
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            detail = f"Failed to get Session info: {str(e)}"
            if hasattr(e, "response") and e.response is not None:
                detail += f" - {e.response.text}"
            raise HTTPException(status_code=500, detail=detail)

    @classmethod
    async def get_me(cls, session: str = "default") -> bytes:
        headers = {"accept": "application/json", "Content-Type": "application/json"}
        if settings.WAHA_API_KEY and settings.WAHA_API_KEY != "key":
            headers["X-Api-Key"] = settings.WAHA_API_KEY
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.WAHA_URL}/{session}/profile",
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            detail = f"Failed to get me: {str(e)}"
            if hasattr(e, "response") and e.response is not None:
                detail += f" - {e.response.text}"
            raise HTTPException(status_code=500, detail=detail)
