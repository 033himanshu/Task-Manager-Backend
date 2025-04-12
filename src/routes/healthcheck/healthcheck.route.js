import express from "express"
import { healthcheck } from "./healthcheck.controller.js"

const router = express.Router()

router.get('/', healthcheck)

export default router