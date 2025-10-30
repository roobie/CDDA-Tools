from typing import Dict, List

from eoctool_test.CDDA import U


DEFAULT_Y = 100

type Expr = str | Dict[str, Expr] | int | float | List[Expr]


def math(expr: Expr) -> Dict[str, Expr]:
    if not isinstance(expr, list):
        expr = [expr]
    return {"math": expr}  # type: ignore


def condition_x_in_y(x: Expr, y: Expr) -> Dict[str, Dict[str, Expr]]:
    return {
        "x_in_y_chance": {
            "x": x,
            "y": y,
        }
    }


def listify(item: Expr | List[Expr]) -> List[Expr]:
    if isinstance(item, list):
        return item
    else:
        return [item]


def if_then_else(
    id: str, condition: Dict[str, Expr], effect: Expr, false_effect: Expr | None = None
) -> Dict[str, Expr]:
    """
    Helper to build the condition dict for an x_in_y_chance check.
    Minimizes inline dictionary noise in tests.
    """
    result = {
        "id": id,
        "condition": condition,
        "effect": listify(effect),
    }
    if false_effect is not None:
        result["false_effect"] = false_effect

    return result


def test_eoc(arg: Expr) -> Dict[str, Expr]:
    return {"test_eoc": arg}


def run_eoc(arg: Expr) -> Dict[str, Expr]:
    return {"run_eocs": arg}


def run_eocs(*args: Expr) -> Dict[str, List[Expr]]:
    return {"run_eocs": args}


class WhenBuilder:
    def __init__(self, condition):
        self._id = None
        self._condition = condition
        self._then = None
        self._otherwise = None

    def with_id(self, id_):
        self._id = id_
        return self

    def then(self, expr):
        self._then = expr
        return self

    # `else` is a Python keyword, use else_ or otherwise
    def otherwise(self, expr):
        self._otherwise = expr
        return self

    def build(self):
        kwargs = {"condition": self._condition}
        if self._then is not None:
            kwargs["effect"] = self._then
        if self._otherwise is not None:
            kwargs["false_effect"] = self._otherwise
        if self._id is not None:
            kwargs["id"] = self._id
        return if_then_else(**kwargs)

    # convenience so the builder can be used where a dict is expected
    def __iter__(self):
        # allow usage like list([when(cond).then(...).otherwise(...)])
        yield self.build()

    def __call__(self):
        return self.build()


def when(condition, id=None) -> WhenBuilder:
    """Start an if-then-else builder: when(cond).then(x).otherwise(y)"""
    builder = WhenBuilder(condition)
    if id is not None:
        builder.with_id(id)
    return builder
