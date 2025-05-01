const express = require('express');
const Event    = require('../models/event.model.js');
const {requireAuth} = require('../middleware/requireAuth.js');

function makeEventsRouter() {
    const router = express.router();

    router.get('/', requireAuth, async (req, res) => {
        
    })

    router.post('/', async (req, res) => {

    })

    router.put('/:id', async (req, res) => {

    })

    router.get('/:id', async (req, res) => {

    })

    router.delete('/:id', async (req, res) => {

    });

    
}