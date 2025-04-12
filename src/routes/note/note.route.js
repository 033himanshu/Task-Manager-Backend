/*
    createNote
    editNote
    deleteNote
*/


import express from "express"
const router = express.Router()

import {
    addNote,
    updateNote,
    deleteNote,
} from './note.controller.js'

import {
    notesValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'

import {verifyJWT, verifyProjectAdmin} from '../../middlewares/authorize.js'

router.use(verifyJWT)
router.use(verifyProjectAdmin)

router.post('/add-note', notesValidator(), validate, addNote)

router.patch('/update-note', notesValidator(), validate, updateNote)
router.delete('/delete-note', deleteNote)

export default router