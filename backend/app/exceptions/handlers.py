from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logger import logger


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "errors": exc.errors()
        }
    )


async def database_exception_handler(
    request: Request,
    exc: SQLAlchemyError
):
    if settings.APP_ENV == "development":
        logger.exception("Database error on %s", request.url.path)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Database error occurred"
        }
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": str(exc)
        }
    )