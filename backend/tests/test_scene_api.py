from fastapi import HTTPException

from backend.api.campus import get_campus


def test_campus_returns_static_scene():
    """
    GET /campus?scene=xatu-campus returns map metadata, depot and
    customers with stable string ids and normalized coordinates.
    It must not expose orders, demands or vehicles.
    """

    data = get_campus("xatu-campus")

    # Scene identity
    assert data["scene"] == "xatu-campus"
    assert data["coordinate_system"] == "norm"

    # Map metadata
    assert data["map"]["image"] == "xatu-campus-map.png"
    assert data["map"]["width"] == 1691
    assert data["map"]["height"] == 1080

    # Depot: stable string id
    depot = data["depot"]
    assert depot["id"] == "depot"
    assert depot["type"] == "depot"
    assert 0.0 <= depot["norm"]["x"] <= 1.0
    assert 0.0 <= depot["norm"]["y"] <= 1.0

    # Customers: 18 dorm nodes, string ids, norm coords
    customers = data["customers"]
    assert len(customers) == 18

    ids = [customer["id"] for customer in customers]
    assert len(set(ids)) == 18
    assert all(isinstance(node_id, str) for node_id in ids)
    assert "dorm_1" in ids
    assert "depot" not in ids

    for customer in customers:
        assert customer["type"] == "dorm"
        assert 0.0 <= customer["norm"]["x"] <= 1.0
        assert 0.0 <= customer["norm"]["y"] <= 1.0
        # Static scene must carry no dynamic simulation fields
        assert "demand" not in customer
        assert "latitude" not in customer
        assert "longitude" not in customer

    # Top level must not contain dynamic layers
    assert "vehicles" not in data
    assert "orders" not in data


def test_campus_real_world_returns_geo_coords():
    """
    GET /campus?scene=real-world (geo) must additionally expose
    latitude / longitude per node for the frontend RealWorldMap,
    while still carrying no dynamic simulation fields.
    """

    data = get_campus("real-world")

    assert data["scene"] == "real-world"
    assert data["coordinate_system"] == "geo"

    for node in [data["depot"], *data["customers"]]:
        # geo 场景显式下发经纬度,供 RealWorldMap 渲染
        assert isinstance(node["latitude"], float)
        assert isinstance(node["longitude"], float)
        assert -90.0 <= node["latitude"] <= 90.0
        assert -180.0 <= node["longitude"] <= 180.0
        # Static scene must carry no dynamic simulation fields
        assert "demand" not in node

    # store 类型节点,可被订单生成器选中
    assert all(customer["type"] == "store" for customer in data["customers"])


def test_campus_default_scene():
    """
    Calling without a scene argument defaults to xatu-campus.
    """

    data = get_campus()
    assert data["scene"] == "xatu-campus"


def test_campus_unknown_scene_raises_400():
    """
    An unknown scene id must raise HTTPException with status 400.
    """

    try:
        get_campus("not-a-scene")
        raise AssertionError("Expected HTTPException for unknown scene")
    except HTTPException as exc:
        assert exc.status_code == 400


if __name__ == "__main__":

    test_campus_returns_static_scene()
    test_campus_default_scene()
    test_campus_unknown_scene_raises_400()

    print("ALL SCENE API TESTS PASSED")
