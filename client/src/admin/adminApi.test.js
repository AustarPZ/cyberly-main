import {
  archiveAdminResource,
  archiveAdminScenario,
  createAdminScenario,
  getAdminScenario,
  getAdminScenarioLifecycle,
  getAdminResourceLifecycle,
  listAdminScenarios,
  permanentlyDeleteAdminScenario,
  permanentlyDeleteAdminResource,
  publishAdminResource,
  publishAdminScenario,
  restoreAdminResource,
  restoreAdminScenario,
  unpublishAdminResource,
  unpublishAdminScenario,
  updateAdminScenarioMetadata,
  updateAdminScenarioSteps,
} from "./adminApi";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe("admin API lifecycle adapter", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("lifecycle failure includes safe HTTP status diagnostic", async () => {
    global.fetch.mockResolvedValue(jsonResponse(404, { code: "ADMIN_RESOURCE_NOT_FOUND" }));

    const result = await getAdminResourceLifecycle(7);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/admin/resources/7/lifecycle", {
      method: "GET",
      credentials: "include",
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toContain("(404)");
  });

  test("resource publish, unpublish, archive, restore, and delete use explicit endpoints", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(200, { resource: { id: 7 } }))
      .mockResolvedValueOnce(jsonResponse(200, { resource: { id: 7 } }))
      .mockResolvedValueOnce(jsonResponse(200, { resource: { id: 7 }, lifecycle: { canRestore: true } }))
      .mockResolvedValueOnce(jsonResponse(200, { resource: { id: 7 }, lifecycle: { canArchive: true } }))
      .mockResolvedValueOnce(jsonResponse(200, { deletedResourceId: 7, deletedSlug: "phishing" }));

    await publishAdminResource(7);
    await unpublishAdminResource(7);
    await archiveAdminResource(7);
    await restoreAdminResource(7);
    await permanentlyDeleteAdminResource(7, "phishing");

    expect(global.fetch.mock.calls.map(call => [call[0], call[1].method])).toEqual([
      ["http://localhost:5000/api/admin/resources/7/publish", "POST"],
      ["http://localhost:5000/api/admin/resources/7/unpublish", "POST"],
      ["http://localhost:5000/api/admin/resources/7/archive", "POST"],
      ["http://localhost:5000/api/admin/resources/7/restore", "POST"],
      ["http://localhost:5000/api/admin/resources/7", "DELETE"],
    ]);
  });

  test("scenario adapter uses the canonical admin scenario endpoints", async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { scenario: { id: 3 }, steps: [] }));

    await listAdminScenarios({ search: "phishing" });
    await createAdminScenario({ slug: "safe-draft" });
    await getAdminScenario(3);
    await updateAdminScenarioMetadata(3, { title: "Updated" });
    await updateAdminScenarioSteps(3, { steps: [] });
    await publishAdminScenario(3);
    await unpublishAdminScenario(3);
    await archiveAdminScenario(3);
    await restoreAdminScenario(3);
    await getAdminScenarioLifecycle(3);
    await permanentlyDeleteAdminScenario(3, "safe-draft");

    expect(global.fetch.mock.calls.map(call => [String(call[0]), call[1].method])).toEqual([
      ["http://localhost:5000/api/admin/scenarios?search=phishing", "GET"],
      ["http://localhost:5000/api/admin/scenarios", "POST"],
      ["http://localhost:5000/api/admin/scenarios/3", "GET"],
      ["http://localhost:5000/api/admin/scenarios/3/metadata", "PATCH"],
      ["http://localhost:5000/api/admin/scenarios/3/steps", "PUT"],
      ["http://localhost:5000/api/admin/scenarios/3/publish", "POST"],
      ["http://localhost:5000/api/admin/scenarios/3/unpublish", "POST"],
      ["http://localhost:5000/api/admin/scenarios/3/archive", "POST"],
      ["http://localhost:5000/api/admin/scenarios/3/restore", "POST"],
      ["http://localhost:5000/api/admin/scenarios/3/lifecycle", "GET"],
      ["http://localhost:5000/api/admin/scenarios/3", "DELETE"],
    ]);
  });
});
