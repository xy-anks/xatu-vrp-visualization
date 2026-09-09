class MapNode:
    """
    A static node on the scene map (depot or customer location).

    Scene Layer entity: describes the world only.
    It carries no demand and no vehicle information — those belong
    to the Simulation / Order layer.

    Coordinates are generic planar coordinates:
      - coordinate_system == "norm": x, y are normalized image coords in [0, 1]
      - coordinate_system == "geo":  x = longitude, y = latitude

    The id is a stable scene-level string id (e.g. "depot", "dorm_1").
    It never changes between simulations and is never used directly as
    a distance-matrix index; problem_builder maps it to a compact
    solver index at problem construction time.
    """

    def __init__(
        self,
        id,
        name,
        node_type,
        x,
        y
    ):
        self.id = id
        self.name = name
        self.type = node_type
        self.x = x
        self.y = y


class MapMeta:
    """
    Static map image metadata for an image-based scene.
    """

    def __init__(
        self,
        image,
        width,
        height
    ):
        self.image = image
        self.width = width
        self.height = height


class SceneMap:
    """
    Static scene description (Scene Layer).

    Contains the map metadata, one depot node and all candidate
    customer nodes. It is shared across simulations and can be cached;
    it never contains orders, demands or vehicles.
    """

    def __init__(
        self,
        scene_id,
        coordinate_system,
        map_meta,
        depot,
        customers
    ):
        self.scene_id = scene_id
        self.coordinate_system = coordinate_system
        self.map = map_meta
        self.depot = depot
        self.customers = customers

    def all_nodes(self):
        """
        Return depot followed by all customer nodes.
        """
        return [self.depot] + self.customers

    def node_by_id(self, node_id):
        """
        Look up a node by its stable scene id.
        Raises KeyError if the id does not exist in this scene.
        """
        if self.depot.id == node_id:
            return self.depot

        for customer in self.customers:
            if customer.id == node_id:
                return customer

        raise KeyError(
            f"Node id '{node_id}' not found in scene '{self.scene_id}'"
        )
