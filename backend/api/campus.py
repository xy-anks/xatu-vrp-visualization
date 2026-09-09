from fastapi import APIRouter, HTTPException

from backend.utils.scene_loader import load_scene


router = APIRouter()


def _serialize_node(node, coordinate_system):
    """
    Serialize a MapNode for the API response.

    norm 字段始终下发(前端 SceneNode.norm 为必填类型,校园场景直接使用):
      - coordinate_system == "norm": x, y 为归一化图片坐标
      - coordinate_system == "geo":  x = longitude, y = latitude
        (与 scene_loader 的通用平面坐标约定一致)
    geo 场景额外显式下发 latitude / longitude,供前端 RealWorldMap 渲染。
    """

    data = {
        "id": node.id,
        "name": node.name,
        "type": node.type,
        "norm": {
            "x": node.x,
            "y": node.y
        }
    }

    if coordinate_system == "geo":
        data["latitude"] = node.y
        data["longitude"] = node.x

    return data


@router.get("/campus")
def get_campus(scene: str = "xatu-campus"):
    """
    Return the static description of a scene (Scene Layer):
    map metadata, depot and customer nodes with coordinates.

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

        "depot": _serialize_node(scene_map.depot, scene_map.coordinate_system),

        "customers": [
            _serialize_node(customer, scene_map.coordinate_system)
            for customer in scene_map.customers
        ]
    }
