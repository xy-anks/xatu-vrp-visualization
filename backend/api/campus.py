from fastapi import APIRouter, HTTPException

from backend.utils.scene_loader import load_scene


router = APIRouter()


@router.get("/campus")
def get_campus(scene: str = "xatu-campus"):
    """
    Return the static description of a scene (Scene Layer):
    map metadata, depot and customer nodes with normalized coordinates.

    No orders are generated and no VRPProblem is built here.
    """

    try:
        scene_map = load_scene(scene)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    return {
        "scene": scene_map.scene_id,
        "coordinate_system": scene_map.coordinate_system,

        "map": {
            "image": scene_map.map.image,
            "width": scene_map.map.width,
            "height": scene_map.map.height
        },

        "depot": {
            "id": scene_map.depot.id,
            "name": scene_map.depot.name,
            "type": scene_map.depot.type,
            "norm": {
                "x": scene_map.depot.x,
                "y": scene_map.depot.y
            }
        },

        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "type": customer.type,
                "norm": {
                    "x": customer.x,
                    "y": customer.y
                }
            }
            for customer in scene_map.customers
        ]
    }
