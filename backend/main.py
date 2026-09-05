from fastapi import FastAPI

from backend.api.solve import router


app = FastAPI(
    title="XATU VRP Visualization",
    description="Campus Vehicle Routing Problem Visualization System",
    version="0.1.0"
)


app.include_router(router)