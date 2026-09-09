from backend.utils.scene_loader import load_scene


def test_load_xatu_campus():
    """
    SceneMap should correctly load the static xatu-campus map:
    map metadata, depot node and 18 customer nodes with stable
    string ids and normalized coordinates.
    """

    scene = load_scene("xatu-campus")

    # ---- Scene identity ----
    assert scene.scene_id == "xatu-campus"
    assert scene.coordinate_system == "norm"

    # ---- Map metadata ----
    assert scene.map.image == "xatu-campus-map.png"
    assert scene.map.width == 1691
    assert scene.map.height == 1080

    # ---- Depot ----
    assert scene.depot.id == "depot"
    assert scene.depot.name == "快递驿站"
    assert scene.depot.type == "depot"

    # ---- Customers ----
    assert len(scene.customers) == 18

    customer_ids = [customer.id for customer in scene.customers]

    # Stable string ids, unique and distinct from depot id
    assert len(set(customer_ids)) == 18
    assert "depot" not in customer_ids

    # Representative semantic ids
    for expected_id in ("dorm_1", "dorm_10", "dorm_intl", "dorm_shuang"):
        assert expected_id in customer_ids

    # Every node is a MapNode with norm coords inside [0, 1]
    for node in scene.all_nodes():
        assert node.id is not None
        assert node.name
        assert 0.0 <= node.x <= 1.0
        assert 0.0 <= node.y <= 1.0

    # ---- Lookup helper ----
    assert scene.node_by_id("depot") is scene.depot
    assert scene.node_by_id("dorm_1").name == "1公寓"

    try:
        scene.node_by_id("not_exist")
        raise AssertionError("Expected KeyError for unknown node id")
    except KeyError:
        pass


def test_load_real_world():
    """
    SceneMap should correctly load the static real-world map:
    geo coordinate system, depot and store nodes with
    longitude (x) / latitude (y) coordinates.
    """

    scene = load_scene("real-world")

    # ---- Scene identity ----
    assert scene.scene_id == "real-world"
    assert scene.coordinate_system == "geo"

    # ---- Depot ----
    assert scene.depot.id == "depot"
    assert scene.depot.type == "depot"

    # ---- Customers: store nodes with plausible geo coords ----
    assert len(scene.customers) > 0

    customer_ids = [customer.id for customer in scene.customers]
    assert len(set(customer_ids)) == len(customer_ids)
    assert "depot" not in customer_ids

    for customer in scene.customers:
        assert customer.type == "store"

    # geo 约定:x = longitude, y = latitude,量级必须在经纬度范围内
    for node in scene.all_nodes():
        assert -180.0 <= node.x <= 180.0
        assert -90.0 <= node.y <= 90.0


def test_unknown_scene_raises():
    """
    Loading an unregistered scene id must raise ValueError.
    """

    try:
        load_scene("not-a-scene")
        raise AssertionError("Expected ValueError for unknown scene")
    except ValueError:
        pass


if __name__ == "__main__":

    test_load_xatu_campus()
    test_unknown_scene_raises()

    scene = load_scene("xatu-campus")

    print("Scene:")
    print(scene.scene_id, "/", scene.coordinate_system)

    print("\nMap:")
    print(scene.map.image, scene.map.width, "x", scene.map.height)

    print("\nDepot:")
    print(scene.depot.id, scene.depot.name, scene.depot.x, scene.depot.y)

    print("\nCustomers:")
    for customer in scene.customers:
        print(
            customer.id,
            customer.name,
            customer.type,
            customer.x,
            customer.y
        )

    print("\nALL SCENE LOADER TESTS PASSED")
