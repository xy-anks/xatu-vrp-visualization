import json
from pathlib import Path

from backend.models.scene import MapNode, MapMeta, SceneMap


# Project root (parent of backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
SCENES_DIR = BASE_DIR / "data" / "scenes"


# Scene registry: single source of truth mapping a stable scene id
# to its static data file. Register new scenes here.
SCENE_FILES = {
    "xatu-campus": "xatu-campus.json",
}


SUPPORTED_COORDINATE_SYSTEMS = ("norm", "geo")


def _extract_coordinate(node_data, coordinate_system):
    """
    Extract generic planar (x, y) coordinates from a raw node dict.

    norm: image map, normalized coords in [0, 1]
    geo:  geographic map, x = longitude, y = latitude
    """

    if coordinate_system == "norm":
        norm = node_data["norm"]
        return norm["x"], norm["y"]

    if coordinate_system == "geo":
        return node_data["longitude"], node_data["latitude"]

    raise ValueError(
        f"Unsupported coordinate_system: {coordinate_system}"
    )


def _parse_node(node_data, coordinate_system, default_type):
    """
    Build a MapNode from a raw node dict.
    """

    x, y = _extract_coordinate(node_data, coordinate_system)

    return MapNode(
        id=node_data["id"],
        name=node_data["name"],
        node_type=node_data.get("type", default_type),
        x=x,
        y=y
    )


def _validate_scene(data, scene_id, scene):
    """
    Validate structural integrity of the loaded scene.
    """

    # The scene field inside the file must match the requested scene id
    if data.get("scene") != scene_id:
        raise ValueError(
            f"Scene id mismatch: file declares '{data.get('scene')}', "
            f"but requested '{scene_id}'"
        )

    nodes = scene.all_nodes()

    # Stable node ids must be unique
    ids = [node.id for node in nodes]

    if len(set(ids)) != len(ids):
        duplicates = [
            node_id for node_id in ids
            if ids.count(node_id) > 1
        ]
        raise ValueError(
            f"Duplicate node ids in scene '{scene_id}': "
            f"{sorted(set(duplicates))}"
        )

    # Normalized image coordinates must lie inside [0, 1]
    if scene.coordinate_system == "norm":
        for node in nodes:
            if not (0.0 <= node.x <= 1.0 and 0.0 <= node.y <= 1.0):
                raise ValueError(
                    f"Node '{node.id}' in scene '{scene_id}' has "
                    f"normalized coordinates out of [0, 1]: "
                    f"({node.x}, {node.y})"
                )


def load_scene(scene_id):
    """
    Load a static scene description (Scene Layer) by scene id.

    Only reads map metadata and node positions. Never loads
    demands, vehicles or orders.

    Args:
        scene_id: stable scene identifier, e.g. "xatu-campus"

    Returns:
        SceneMap

    Raises:
        ValueError: unknown / mismatched scene id or malformed data
        FileNotFoundError: registered scene file is missing
    """

    if scene_id not in SCENE_FILES:
        raise ValueError(
            f"Unknown scene: '{scene_id}'. "
            f"Supported scenes: {sorted(SCENE_FILES)}"
        )

    path = SCENES_DIR / SCENE_FILES[scene_id]

    if not path.exists():
        raise FileNotFoundError(
            f"Scene data file not found: {path}"
        )

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    coordinate_system = data.get("coordinate_system", "norm")

    if coordinate_system not in SUPPORTED_COORDINATE_SYSTEMS:
        raise ValueError(
            f"Unsupported coordinate_system '{coordinate_system}' "
            f"in scene '{scene_id}', expected one of "
            f"{SUPPORTED_COORDINATE_SYSTEMS}"
        )

    map_data = data["map"]

    map_meta = MapMeta(
        image=map_data["image"],
        width=map_data["width"],
        height=map_data["height"]
    )

    depot = _parse_node(
        data["depot"],
        coordinate_system,
        default_type="depot"
    )

    customers = [
        _parse_node(node_data, coordinate_system, default_type="customer")
        for node_data in data["customers"]
    ]

    scene = SceneMap(
        scene_id=scene_id,
        coordinate_system=coordinate_system,
        map_meta=map_meta,
        depot=depot,
        customers=customers
    )

    _validate_scene(data, scene_id, scene)

    return scene
