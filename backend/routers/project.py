"""项目管理路由 - 支持多项目切换"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

from services.progress_service import progress_service
from routers.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["项目管理"])


class ProjectInfo(BaseModel):
    id: str
    name: str
    current_step: int
    completed_steps: List[int]
    created_at: Optional[str]
    updated_at: Optional[str]
    is_current: bool


class ProjectListResponse(BaseModel):
    projects: List[ProjectInfo]
    current_project_id: str


class CreateProjectRequest(BaseModel):
    name: str


class CreateProjectResponse(BaseModel):
    success: bool
    project: ProjectInfo
    message: str


class SwitchProjectRequest(BaseModel):
    project_id: str


class SwitchProjectResponse(BaseModel):
    success: bool
    message: str


class RenameProjectRequest(BaseModel):
    project_id: str
    name: str


class DeleteProjectRequest(BaseModel):
    project_id: str


@router.get("/list", response_model=ProjectListResponse)
async def list_projects(username: str = Depends(get_current_user)):
    """获取用户所有项目列表"""
    projects = progress_service.get_projects(username)
    current_id = progress_service.get_current_project_id(username)

    return ProjectListResponse(
        projects=[ProjectInfo(**p) for p in projects],
        current_project_id=current_id
    )


@router.post("/create", response_model=CreateProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    username: str = Depends(get_current_user)
):
    """创建新项目"""
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="项目名称不能为空")

    if len(request.name) > 50:
        raise HTTPException(status_code=400, detail="项目名称不能超过50个字符")

    project = progress_service.create_project(username, request.name.strip())

    return CreateProjectResponse(
        success=True,
        project=ProjectInfo(
            id=project["id"],
            name=project["name"],
            current_step=project["current_step"],
            completed_steps=project["completed_steps"],
            created_at=project["created_at"],
            updated_at=project["updated_at"],
            is_current=True
        ),
        message="项目创建成功"
    )


@router.post("/switch", response_model=SwitchProjectResponse)
async def switch_project(
    request: SwitchProjectRequest,
    username: str = Depends(get_current_user)
):
    """切换当前项目"""
    success = progress_service.switch_project(username, request.project_id)

    if not success:
        raise HTTPException(status_code=404, detail="项目不存在")

    return SwitchProjectResponse(
        success=True,
        message="切换项目成功"
    )


@router.post("/rename")
async def rename_project(
    request: RenameProjectRequest,
    username: str = Depends(get_current_user)
):
    """重命名项目"""
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="项目名称不能为空")

    if len(request.name) > 50:
        raise HTTPException(status_code=400, detail="项目名称不能超过50个字符")

    success = progress_service.rename_project(
        username, request.project_id, request.name.strip()
    )

    if not success:
        raise HTTPException(status_code=404, detail="项目不存在")

    return {"success": True, "message": "重命名成功"}


@router.post("/delete")
async def delete_project(
    request: DeleteProjectRequest,
    username: str = Depends(get_current_user)
):
    """删除项目"""
    success = progress_service.delete_project(username, request.project_id)

    if not success:
        raise HTTPException(status_code=400, detail="无法删除项目（可能是最后一个项目或项目不存在）")

    return {"success": True, "message": "项目已删除"}
