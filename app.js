import express from 'express';
import cors from 'cors';
const app = express();

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.locals.title = 'Test Server';
app.use(cors());
app.use(express.json());

app.get('/', (request, response) => {
  response.send('We\'re going to test all the routes!');
});

app.get('/api/v1/palettes', async (request, response) => {
  try {
    const palettes = await database('palettes').select();

    response.status(200).json({ palettes });
  } catch (error) {
    response.status(500).json({ error });
  }
});

app.get('/api/v1/palettes/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const palette = await database('palettes').where('id', id);
    palette.length 
      ? response.status(200).json(palette[0]) 
      : response.status(404).json({
        error: `Could not find palette with the id: ${id}`
      });
  } catch (error) {
    response.status(500).json({ error });
  }
});

app.post('/api/v1/palettes', async (request, response) => {
  const palette = request.body;

  for (let requiredParameter of ['color1', 'color2', 'color3', 'color4', 'color5', 'project_id']) {
    if (!palette.hasOwnProperty(requiredParameter)) {
      return response.status(422).send({ error: `The expected format is: { project_id: <Integer> }. You are missing the ${requiredParameter} property.` });
    };
  };

  try {
    const id = await database('palettes').insert(palette, 'id');
    response.status(201).json({ ...palette, id });
  } catch (error) {
    response.status(500).json({ error });
  };
});

app.delete('/api/v1/palettes', async (request, response) => {
  const { id } = request.body;

  if (!id) {
    return response.status(422).json({ error: 'The expected format is: { id: <Number> }. You are missing the id property.'})
  };
  await database('palettes').where('id', parseInt(id)).del();
  
  try {
    response.status(200).json(id)
  } catch (error) {
    response.status(500).json({ error })
  }
});

app.get('/api/v1/projects', async (request, response) => {
  try {
    const projects = await database('projects').select();
    response.status(200).json(projects);
  } catch (error) {
    response.status(404).send({ error })
  }
});

app.get('/api/v1/projects/:id', async (request, response) => {
  const { id } = request.params;

  try {
    const project = await database('projects').where('id', id);

    if(project.length) {
      response.status(200).json(project);
    } else {
      response.status(404).json({ error: `A project with the id of ${id} does not exist.`})
    }
  } catch (error) {
    response.status(500).json({ error });
  }
});

app.post('/api/v1/projects/', async (request, response) => {
  const project = request.body;

  for (let requiredParameter of ['name']) {
    if (!project.hasOwnProperty(requiredParameter)) {
      return response.status(422).send({ error: `The expected format is: { name: <String> }. You are missing the ${requiredParameter} property.` });
    };
  };

  try {
    const id = await database('projects').insert(project, 'id');
    response.status(201).json({ ...project, id });
  } catch (error) {
    response.status(500).json({ error });
  };
});

app.delete('/api/v1/projects', (request, response) => {
  const { id } = request.body;

  if (!id) {
    return response.status(422).json({ error: 'The expected format is: { id: <Number> }. You are missing the id property.'})
  }

  database('projects')
    .where('id', parseInt(id))
    .del()
    .then(response.status(200).json(id))
    .catch(error => response.status(500).json({ error }));
});


module.exports = app;
