import "@babel/polyfill";
import request from 'supertest';
import app from './app';

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

describe('Server', () => {

  beforeEach(async () => {
    await database.seed.run();
  });

  describe('init', () => {
    it('should return a 200 status', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });
  });

  describe('GET endpoints for palettes', () => {
    describe('GET endpoint for all palettes', () => {
      it('should return a 200 status and all of the palettes', async () => {
        const expected = await database('palettes').select();
        const response = await request(app).get('/api/v1/palettes');
        const palettes = response.body;

        expect(response.status).toBe(200);
        expect(palettes.palettes[0].id).toEqual(expected[0].id);
      });
    });

    describe('GET endpoint for individual palette', () => {
      it('should return a 200 status and the specific palette chosen', async () => {
        const expected = await database('palettes').first();
        const { id } = expected;
        const response = await request(app).get(`/api/v1/palettes/${id}`);
        const result = response.body;

        expect(response.status).toBe(200);
        expect(result.id).toEqual(id);
      });

      it('should return a code of 404 if the project does not exist', async () => {
        const invalidId = -100;
        const response = await request(app).get(`/api/v1/palettes/${invalidId}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual(`Could not find palette with the id: -100`)
      });
    });

    describe('GET endpoint for all palettes with chosen color', () => {
      it('should return a 200 with all palettes that include the queried hex code', async () => {
        // Set up DB with two palettes that meet query
        const PaletteOne = {
          name: 'new palette one',
          color1: '1111a',
          color2: '22222b',
          color3: '111111',
          color4: '111111',
          color5: '111111'
        };
        const PaletteTwo = {
          name: 'new palette two',
          color1: '22222a',
          color2: 'FFFFFF',
          color3: '111111',
          color4: '111111',
          color5: '111111'
        };

        const postOne = await request(app).post(`/api/v1/palettes`).send(PaletteOne);
        const postTwo = await request(app).post(`/api/v1/palettes`).send(PaletteTwo);
        const colorSearch = '?chosenColor=22222a';
        const expectedResponse = { palettes: [
          {
            name: 'new palette one',
            color1: '1111a',
            color2: '22222b',
            color3: '111111',
            color4: '111111',
            color5: '111111'
          },
        ]};
        const response = await request(app).get(`/api/v1/palettes/chooseColors/${colorSearch}`);
        const searchedPalettes = response.body;
        expect(response.status).toBe(200);
        expect(searchedPalettes.filteredPalettes[0].color1).toEqual(expectedResponse.palettes[0].color1);
      });
    });
  });

  describe('POST /api/v1/palettes', () => {
    it('should post a new palette to the database', async () => {
      const expectedProject = await database('projects').first();
      const { id } = expectedProject;
      const newpalette = {
        name: 'test palette',
        color1: '1221b',
        color2: '21122b',
        color3: '34433b',
        color4: '43344b',
        color5: '56655b',
        project_id: `${id}`,
      };
      const response = await request(app).post('/api/v1/palettes').send(newpalette);
      console.log(response);
      console.log(response.body);
      console.log(response.id);
      const palettes = await database('palettes').where('id', response.body.id).select();

      expect(response.status).toBe(201);
      expect(palettes[0].color1).toEqual(newpalette.color1);
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const newpalette = {
        color1: '1221b',
        color2: '21122b',
        color3: '34433b',
        color4: '43344b',
        color5: '56655b',
      };
      const response = await request(app).post('/api/v1/palettes').send(newpalette);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('The expected format is: { project_id: <Integer>, color1: <String>, color2: <String>, color3: <String>, color4: <String>, color5: <String>, name: <String> }. You are missing the project_id property.')
    });
  });

  describe('DELETE /api/v1/palettes', () => {
    it('should delete a palette from the database', async () => {
      const expectedPallete = await database('palettes').first();
      const { id } = expectedPallete;
      const response = await request(app).delete('/api/v1/palettes').send({ id });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(id);
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const response = await request(app).delete('/api/v1/palettes').send({});

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('The expected format is: { id: <Number> }. You are missing the id property.')
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return a status code of 200 and all projects', async () => {
      const expectedProjects = await database('projects').select();
      const response = await request(app).get('/api/v1/projects');
      const projects = response.body;

      expect(response.status).toBe(200);
      expect(projects.projects[0].id).toEqual(expectedProjects[0].id);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should return a code of 200 and a single project if the project exists', async () => {
      const expectedProject = await database('projects').first();
      const { id } = expectedProject;
      const response = await request(app).get(`/api/v1/projects/${id}`);
      const result = response.body[0];

      expect(response.status).toBe(200);
      expect(result.id).toEqual(expectedProject.id);
    });

    it('should return a code of 404 if the project does not exist', async () => {
      const invalidId = -100;
      const response = await request(app).get(`/api/v1/projects/${invalidId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual(`A project with the id of ${invalidId} does not exist.`);
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should post a new project to the database', async () => {
      const newProject = { name: 'Pants' };
      const response = await request(app).post('/api/v1/projects').send(newProject);
      const projects = await database('projects').where('id', response.body.id);
      const project = projects[0];

      expect(response.status).toBe(201);
      expect(project.name).toEqual(newProject.name);
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const newProject = { title: 'Pants' };
      const response = await request(app).post('/api/v1/projects').send(newProject);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('You are missing a name property for this project')
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    it('should change the name property of a specified project', async () => {
      const newName = { name: 'test PUT' };
      const expectedProject = await database('projects').first();
      const { id } = expectedProject;
      const response = await request(app).put(`/api/v1/projects/${id}`).send(newName);
      const projects = await database('projects').where('id', id);
      const project = projects[0];

      expect(response.status).toBe(200);
      expect(project.name).toEqual(newName.name);
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const newName = { title: 'Pants'};
      const expectedProject = await database('projects').first();
      const { id } = expectedProject;
      const response = await request(app).put(`/api/v1/projects/${id}`).send(newName);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('You are missing a name property for this project');
    });
  });

  describe('DELETE /api/v1/projects', () => {
    it('should delete a project from the database', async () => {
      const expectedProject = await database('projects').first();
      const { id } = expectedProject;
      const response = await request(app).delete('/api/v1/projects').send({ id });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(id);
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const response = await request(app).delete('/api/v1/projects').send({});

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('The expected format is: { id: <Number> }. You are missing the id property.');
    });
  });

  describe('PATCH /api/v1/palettes/:id', () => {
    it('should change the name property of a specified project', async () => {
      const newColor = { changeColor: 'color1', newColor: 'BBBBBBB' };
      const expectedPalette = await database('palettes').first();
      const { id } = expectedPalette;
      const response = await request(app).patch(`/api/v1/palettes/${id}`).send(newColor);
      const palettes = await database('palettes').where('id', id);
      const palette = palettes[0];

      expect(response.status).toBe(200);
      expect(palette.color1).toEqual('BBBBBBB');
    });

    it('should return a code of 422 if the payload is incorrect', async () => {
      const newColor = { newColor: 'BBBBBBB' };
      const expectedPalette = await database('palettes').first();
      const { id } = expectedPalette;
      const response = await request(app).patch(`/api/v1/palettes/${id}`).send(newColor);

      expect(response.status).toBe(422);
      expect(response.body.error).toEqual('You are missing a property! We expect { changeColor: <String>, newColor: <String> }');
    });
  });
});
