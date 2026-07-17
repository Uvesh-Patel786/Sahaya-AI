import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Opportunity } from "../models/Opportunity.js";
import { DigitalTwin } from "../models/DigitalTwin.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    const type = String(req.query.type || "");
    const filter: Record<string, unknown> = { active: true };
    if (type) filter.type = type;
    if (twin?.categories?.length) {
      filter.$or = [{ targetGroups: { $in: twin.categories } }, { targetGroups: { $size: 0 } }];
    }
    if (twin?.state) {
      filter.states = { $in: ["ALL", twin.state] };
    }
    const opportunities = await Opportunity.find(filter).sort({ deadline: 1 }).limit(40);
    res.json({ opportunities });
  } catch (e) {
    next(e);
  }
});

export default router;
