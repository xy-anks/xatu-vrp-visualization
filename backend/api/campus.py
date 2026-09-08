from fastapi import APIRouter
from pathlib import Path

from backend.utils.campus_loader import load_campus_data


router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent.parent

@router.get("/campus")
def get_campus():

    depot, customers, vehicles = load_campus_data(
        str(BASE_DIR / "data" / "campus.json")
    )


    return {

        "depot": {
            "id": depot.id,
            "name": depot.name,
            "latitude": depot.latitude,
            "longitude": depot.longitude
        },


        "customers":[
            {
                "id": customer.id,
                "name": customer.name,
                "latitude": customer.latitude,
                "longitude": customer.longitude,
                "demand": customer.demand
            }

            for customer in customers
        ],


        "vehicles":[
            {
                "id": vehicle.id,
                "capacity": vehicle.capacity
            }

            for vehicle in vehicles
        ]

    }