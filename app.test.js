import "@babel/polyfill";
import request from 'supertest';
import app from './app';

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

describe('Server', () => {

  beforeEach(async () => {
    await database.seed.run();
  })

  describe('init', () => {
    it('should return a 200 status', async () => {
      const res = await request(app).get('/')
      expect(res.status).toBe(200)
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return a status code of 200 and all projects', async () => {
      const expectedProjects = await database('projects').select();
      const response = await request(app).get('/api/v1/projects');
      const projects = response.body;

      expect(response.status).toBe(200);
      expect(projects[0].id).toEqual(expectedProjects[0].id);
    })
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
      expect(response.body.error).toEqual(`A project with the id of ${invalidId} does not exist.`)
    });
  });

});
