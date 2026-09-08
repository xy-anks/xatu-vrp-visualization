from fastapi import FastAPI

from backend.api.solve import router as solve_router
from backend.api.algorithm import router as algorithm_router
from backend.api.campus import router as campus_router


app = FastAPI(
    title="XATU VRP Visualization",
    description="Campus Vehicle Routing Problem Visualization System",
    version="0.1.0"
)


app.include_router(
    solve_router
)

app.include_router(
    algorithm_router
)

app.include_router(
    campus_router
)