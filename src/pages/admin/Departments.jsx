import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import departmentService from "../../services/departmentService";

import "../../styles/pages/admin/Departments.css";

const Departments = () => {
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);

    try {
      const data = await departmentService.getAll();

      setDepartments(data || []);
    } catch (error) {
      console.error(
        "Failed to load departments:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to load departments.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return departments;
    }

    return departments.filter((department) => {
      const name =
        department.departmentName?.toLowerCase() || "";

      const departmentDescription =
        department.description?.toLowerCase() || "";

      const departmentLocation =
        department.location?.toLowerCase() || "";

      return (
        name.includes(term) ||
        departmentDescription.includes(term) ||
        departmentLocation.includes(term)
      );
    });
  }, [departments, searchTerm]);

  const resetForm = () => {
    setDepartmentName("");
    setDescription("");
    setLocation("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = departmentName.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (!name) {
      toast.error("Department name is required.");
      return;
    }

    setCreating(true);

    try {
      const created =
        await departmentService.create({
          departmentName: name,
          description:
            trimmedDescription || null,
          location:
            trimmedLocation || null,
        });

      setDepartments((current) =>
        [...current, created].sort((a, b) =>
          a.departmentName.localeCompare(
            b.departmentName
          )
        )
      );

      resetForm();

      toast.success(
        "Department created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create department:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to create department.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="smarthealth-admin-departments">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="smarthealth-admin-departments-header">

        <div>
          <span className="smarthealth-admin-departments-eyebrow">
            Management
          </span>

          <h1>Departments</h1>

          <p>
            Manage the departments available in the
            healthcare system.
          </p>
        </div>

        <div className="smarthealth-admin-departments-count">
          <span>Total</span>

          <strong>
            {departments.length}
          </strong>
        </div>

      </section>

      {/* =====================================================
          ADD DEPARTMENT
      ====================================================== */}

      <section className="smarthealth-admin-department-form-card">

        <div className="smarthealth-admin-department-form-header">

          <div className="smarthealth-admin-department-form-icon">
            +
          </div>

          <div>
            <h2>Add Department</h2>

            <p>
              Create a new healthcare department.
            </p>
          </div>

        </div>

        <form
          className="smarthealth-admin-department-form"
          onSubmit={handleSubmit}
        >

          <div className="smarthealth-admin-department-field">
            <label htmlFor="departmentName">
              Department Name
            </label>

            <input
              id="departmentName"
              type="text"
              value={departmentName}
              onChange={(event) =>
                setDepartmentName(
                  event.target.value
                )
              }
              placeholder="e.g. Cardiology Department"
              maxLength={100}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-department-field">
            <label htmlFor="departmentLocation">
              Location
            </label>

            <input
              id="departmentLocation"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="e.g. Main Building - Floor 2"
              maxLength={150}
              disabled={creating}
            />
          </div>

          <div className="smarthealth-admin-department-field smarthealth-admin-department-description-field">
            <label htmlFor="departmentDescription">
              Description
            </label>

            <input
              id="departmentDescription"
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Brief department description"
              maxLength={300}
              disabled={creating}
            />
          </div>

          <button
            type="submit"
            className="smarthealth-admin-department-submit"
            disabled={creating}
          >
            {creating ? (
              <>
                <span className="smarthealth-admin-department-button-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <span>+</span>
                Add Department
              </>
            )}
          </button>

        </form>

      </section>

      {/* =====================================================
          DEPARTMENT LIST
      ====================================================== */}

      <section className="smarthealth-admin-departments-list-card">

        <div className="smarthealth-admin-departments-list-header">

          <div>
            <h2>All Departments</h2>

            <p>
              View and search registered healthcare
              departments.
            </p>
          </div>

          <div className="smarthealth-admin-departments-search">

            <span>⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search departments..."
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="smarthealth-admin-departments-loading">

            <div className="smarthealth-admin-departments-spinner"></div>

            <p>
              Loading departments...
            </p>

          </div>
        ) : filteredDepartments.length === 0 ? (

          /* ===============================================
             EMPTY STATE
          ================================================ */

          <div className="smarthealth-admin-departments-empty">

            <div className="smarthealth-admin-departments-empty-icon">
              ▦
            </div>

            {searchTerm ? (
              <>
                <h3>
                  No matching departments
                </h3>

                <p>
                  No department matches "
                  {searchTerm}".
                </p>

                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3>
                  No departments found
                </h3>

                <p>
                  Add your first healthcare department
                  using the form above.
                </p>
              </>
            )}

          </div>
        ) : (

          /* ===============================================
             TABLE
          ================================================ */

          <div className="smarthealth-admin-departments-table-wrapper">

            <table className="smarthealth-admin-departments-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>

                {filteredDepartments.map(
                  (department, index) => (
                    <tr
                      key={
                        department.departmentId
                      }
                    >

                      <td>
                        <span className="smarthealth-admin-department-number">
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <div className="smarthealth-admin-department-name">

                          <span className="smarthealth-admin-department-icon">
                            ▦
                          </span>

                          <strong>
                            {department.departmentName}
                          </strong>

                        </div>
                      </td>

                      <td>
                        {department.location ? (
                          <span className="smarthealth-admin-department-location">
                            <span>⌖</span>
                            {department.location}
                          </span>
                        ) : (
                          <span className="smarthealth-admin-department-muted">
                            Not specified
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="smarthealth-admin-department-description">
                          {department.description ||
                            "No description"}
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
};

export default Departments;