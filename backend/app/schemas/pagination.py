from typing import List

from pydantic import BaseModel

from app.schemas.student import StudentRead


class StudentPagination(BaseModel):
    total_count: int
    items: List[StudentRead]