import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import confetti from "canvas-confetti";
import { checkNameInDatabase } from "./services/nameService";
import "./App.css";
import {
  sanitizeInput,
  isValidName,
  isSuspiciousInput,
} from "./services/validation";
import Captcha from "./components/Captcha";

function App() {
  // Split name states
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [extension, setExtension] = useState("");

  // Birthday states
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add this with your other state declarations
  const [isTagalog, setIsTagalog] = useState(true); // true = Tagalog, false = English

  // Add this with your other state declarations
  const [hasAgreed, setHasAgreed] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  // Ref for modal content to trigger confetti
  const modalContentRef = useRef(null);

  // Handler functions for requirements modal
  // Handler functions for requirements modal
  const handleShowRequirements = () => {
    setShowRequirementsModal(true);
    setHasAgreed(false); // Reset checkbox when modal opens
  };

  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState("");

  const captchaRef = useRef(null);

  const handleCloseRequirements = () => {
    setShowRequirementsModal(false);
  };

  // Extension name options (Roman numerals up to VI)
  const extensionOptions = [
    { value: "", label: "None" },
    { value: "Jr.", label: "Jr." },
    { value: "Sr.", label: "Sr." },
    { value: "I", label: "I" },
    { value: "II", label: "II" },
    { value: "III", label: "III" },
    { value: "IV", label: "IV" },
    { value: "V", label: "V" },
    { value: "VI", label: "VI" },
  ];

  // Month options
  const monthOptions = [
    { value: "", label: "Month" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate day options (1-31)
  const dayOptions = () => {
    const days = [{ value: "", label: "Day" }];
    for (let i = 1; i <= 31; i++) {
      days.push({ value: i.toString().padStart(2, "0"), label: i.toString() });
    }
    return days;
  };

  // Generate year options (1900 to current year)
  const yearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: "", label: "Year" }];
    for (let i = currentYear; i >= 1900; i--) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  };

  // Normalize string for comparison (handles accents, ñ, and case)
  // Note: This is still used by getFullName
  const normalizeString = (str) => {
    if (!str) return "";

    // Convert to string and trim
    const normalized = str.toString().trim();

    // Normalize Unicode characters and convert to lowercase
    // This handles ñ, á, é, í, ó, ú, ü, etc.
    return normalized
      .normalize("NFD") // Decompose combined characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
      .toLowerCase(); // Convert to lowercase for case-insensitive comparison
  };

  // Combine name parts into full name (preserve original case for display)
  const getFullName = (last, first, middle, ext) => {
    const parts = [];
    if (first) parts.push(first);
    if (middle) parts.push(middle);
    if (last) parts.push(last);
    const fullName = parts.join(" ");
    return ext ? `${fullName}, ${ext}` : fullName;
  };

  // Lightweight confetti function that targets the modal
  const fireConfettiInModal = () => {
    // Fallback to center of screen if modal ref isn't available
    try {
      let originX = 0.5;
      let originY = 0.5;

      // Try to get modal position if ref is available
      if (
        modalContentRef.current &&
        modalContentRef.current.getBoundingClientRect
      ) {
        const rect = modalContentRef.current.getBoundingClientRect();
        originX = (rect.left + rect.width / 2) / window.innerWidth;
        originY = (rect.top + rect.height / 2) / window.innerHeight;
      }

      // First burst - center of modal/screen
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: ["#26ccff", "#a25afd", "#ff5e7d", "#ffac46", "#25ff83"],
        startVelocity: 25,
        zIndex: 10001, // Make sure this is higher than modal's z-index
      });

      // Second burst - left side
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { x: Math.max(0, originX - 0.1), y: originY },
          colors: ["#26ccff", "#a25afd", "#ff5e7d"],
          startVelocity: 20,
          zIndex: 10001,
        });
      }, 150);

      // Third burst - right side
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { x: Math.min(1, originX + 0.1), y: originY },
          colors: ["#ffac46", "#25ff83", "#ff5e7d"],
          startVelocity: 20,
          zIndex: 10001,
        });
      }, 300);

      // Fourth burst - top
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { x: originX, y: Math.max(0, originY - 0.15) },
          colors: ["#ff5e7d", "#ffac46", "#26ccff"],
          startVelocity: 18,
          zIndex: 10001,
        });
      }, 450);
    } catch (error) {
      console.log("Confetti error:", error);
      // Fallback to simple confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#26ccff", "#a25afd", "#ff5e7d", "#ffac46", "#25ff83"],
        zIndex: 10001,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    // Validate birthday fields (required)
    if (!month) {
      setError("Month is required");
      return;
    }
    if (!day) {
      setError("Day is required");
      return;
    }
    if (!year) {
      setError("Year is required");
      return;
    }

    // ===== ADD SECURITY VALIDATION HERE =====
    // Sanitize inputs
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedMiddleName = sanitizeInput(middleName);

    // Check for suspicious patterns
    if (
      isSuspiciousInput(sanitizedLastName) ||
      isSuspiciousInput(sanitizedFirstName) ||
      isSuspiciousInput(sanitizedMiddleName)
    ) {
      setError("Invalid input detected");
      return;
    }

    // Validate name format
    if (!isValidName(sanitizedLastName) || !isValidName(sanitizedFirstName)) {
      setError("Name contains invalid characters");
      return;
    }
    // ===== END SECURITY VALIDATION =====

    // Validate CAPTCHA
    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA verification");
      return;
    }
    setCaptchaError("");

    setLoading(true);
    setError("");

    try {
      // Format birthday for database (YYYY-MM-DD)
      const formattedBirthday = `${year}-${month}-${day}`;

      // Call Supabase to check if name exists
      const result = await checkNameInDatabase(
        sanitizedLastName.toUpperCase(), // Use sanitized version
        sanitizedFirstName.toUpperCase(), // Use sanitized version
        formattedBirthday,
        sanitizedMiddleName.toUpperCase(), // Use sanitized version
        extension.toUpperCase(),
      );

      // Rest of your code...
      const fullName = getFullName(lastName, firstName, middleName, extension);
      const monthName =
        monthOptions.find((m) => m.value === month)?.label || month;
      const displayBirthday = `${monthName} ${parseInt(day)}, ${year}`;

      // Create result object with data from database
      const newResult = {
        fullName: fullName,
        lastName: lastName, // Keep original for display
        firstName: firstName, // Keep original for display
        middleName: middleName || null,
        extension: extension || null,
        municipality: result.data?.municipality || null,
        birthday: displayBirthday,
        exists: result.exists,
        timestamp: new Date().toLocaleString(),
      };

      setResult(newResult);
      setShowModal(true);

      // Reset CAPTCHA after successful submission
      setCaptchaToken(null);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    } catch (error) {
      setError("Database error. Please try again.");
      console.error("Error checking name:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setLastName("");
    setFirstName("");
    setMiddleName("");
    setExtension("");
    setMonth("");
    setDay("");
    setYear("");
    setResult(null);
    setError("");
    setCaptchaToken(null);
    setCaptchaError("");

    // Reset the CAPTCHA component
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle new search from modal
  const handleNewSearch = () => {
    setShowModal(false);
    // Reset CAPTCHA when starting a new search
    setCaptchaToken(null);
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  // Trigger confetti when success modal is shown
  useEffect(() => {
    if (showModal && result?.exists) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        fireConfettiInModal();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showModal, result]);

  return (
    <div className="modern-green-theme">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="modern-card">
              <Card.Header
                as="h2"
                className="modern-header text-center text-white py-3"
              >
                Application Checker
              </Card.Header>
              <Card.Body className="p-4">
                {/* Search Form */}
                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Last Name - Required */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          Last Name <span className="required-star">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter last name"
                          className="modern-input text-uppercase"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* First Name - Required */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          First Name <span className="required-star">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter first name"
                          className="modern-input text-uppercase"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Middle Name - Optional */}
                    <Col md={6} className="my-2">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          Middle Name{" "}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          className="modern-input text-uppercase"
                          placeholder="Enter middle name"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          disabled={loading}
                        />
                      </Form.Group>
                    </Col>

                    {/* Extension Name - Optional Dropdown */}
                    <Col md={6} className="my-2">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          Extension Name{" "}
                        </Form.Label>
                        <Form.Select
                          className="modern-select"
                          value={extension}
                          onChange={(e) => setExtension(e.target.value)}
                          disabled={loading}
                        >
                          {extensionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Birthday Section */}
                  <Card className="birthday-card">
                    <Card.Header as="h6" className="birthday-card-header">
                      <i className="bi bi-calendar-check me-2"></i>
                      Birthday <span className="required-star">*</span>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        {/* Month - Required */}
                        <Col md={4} className="mb-2">
                          <Form.Select
                            className="modern-select"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            disabled={loading}
                            required
                          >
                            {monthOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>

                        {/* Day - Required */}
                        <Col md={4} className="mb-2">
                          <Form.Select
                            className="modern-select"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            disabled={loading}
                            required
                          >
                            {dayOptions().map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>

                        {/* Year - Required */}
                        <Col md={4} className="mb-2">
                          <Form.Select
                            className="modern-select"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            disabled={loading}
                            required
                          >
                            {yearOptions().map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* CAPTCHA Section */}
                  <Row className="mt-4 mb-3">
                    <Col md={12}>
                      <Form.Label className="modern-label">
                        <i className="bi bi-shield-check me-2"></i>
                        Verification <span className="required-star">*</span>
                      </Form.Label>
                      <Captcha
                        ref={captchaRef}
                        onVerify={setCaptchaToken}
                        onExpire={() => setCaptchaToken(null)}
                      />
                      {captchaError && (
                        <Form.Text className="text-danger mt-2 d-block">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          {captchaError}
                        </Form.Text>
                      )}
                    </Col>
                  </Row>

                  {/* Form Actions */}
                  <Row className="mt-3 align-items-center">
                    <Col md={10} className="mb-2 mb-md-0">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="modern-button-primary w-100"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="modern-spinner me-2"
                            />
                            Checking...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-search me-2"></i>
                            Check Name
                          </>
                        )}
                      </Button>
                    </Col>
                    <Col md={2} className="mb-2 mb-md-0">
                      <Button
                        variant="outline-secondary"
                        onClick={handleClear}
                        disabled={loading}
                        className="modern-button-clear w-100"
                        size="lg"
                        title="Clear form"
                      >
                        <i className="bi bi-arrow-counterclockwise fs-5"></i>
                      </Button>
                    </Col>
                  </Row>
                </Form>

                {/* Error Message */}
                {error && (
                  <Alert variant="danger" className="modern-alert-error mt-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Result Modal */}
            <Modal
              show={showModal}
              onHide={handleCloseModal}
              centered
              size="lg"
              backdrop="static"
              className="modern-modal"
            >
              {result && result.exists ? (
                // Success Modal
                <>
                  <Modal.Header className="modal-success-header text-white">
                    <Modal.Title className="w-100 text-center text-uppercase">
                      Verification Result
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body
                    className="modal-success-body"
                    ref={modalContentRef}
                  >
                    <div className="text-center mb-4">
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ fontSize: "4rem", color: "#2e7d32" }}
                      ></i>
                    </div>

                    <Card className="success-message-card">
                      <Card.Body className="p-4">
                        <p className="modal-text fs-5">
                          We are pleased to inform you that{" "}
                          <strong className="text-uppercase">
                            {result.lastName}
                          </strong>
                          ,{" "}
                          <strong className="text-uppercase">
                            {result.firstName}
                          </strong>{" "}
                          {result.middleName && (
                            <strong className="text-uppercase">
                              {result.middleName}
                            </strong>
                          )}{" "}
                          {result.extension && (
                            <strong className="text-uppercase">
                              {result.extension}
                            </strong>
                          )}{" "}
                          , born on <strong>{result.birthday}</strong>, a
                          resident of{" "}
                          <span className="text-capitalize">
                            {result.municipality}
                          </span>
                          , Camarines Norte, has been{" "}
                          <strong className="fw-bold text-success text-uppercase">
                            successfully included in the Cleanlisted
                            Beneficiaries.{" "}
                          </strong>
                        </p>

                        <p className="modal-text fs-5 mt-4">
                          Your inclusion in the cleanlist signifies that your
                          information has been properly verified and validated
                          according to the program guidelines. We commend your
                          cooperation and participation throughout the process.
                        </p>

                        {/* Schedule Section with Custom CSS */}
                        <div className="schedule-container mt-4 p-3 p-md-4 bg-light rounded-3 border-start border-success border-4">
                          <h5 className="schedule-title text-success fw-bold mb-3 d-flex align-items-center">
                            <i className="bi bi-calendar-check me-2"></i>
                            Schedule of Validation and Paper Screening
                          </h5>

                          <p className="small mb-3">
                            The validation and paper screening of{" "}
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleShowRequirements();
                              }}
                              className="text-success fw-bold text-decoration-none"
                              style={{
                                cursor: "pointer",
                                borderBottom: "1px dashed currentColor",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.borderBottomStyle = "solid")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.borderBottomStyle = "dashed")
                              }
                            >
                              requirements
                            </a>{" "}
                            will be conducted at the following venue:
                          </p>

                          <div className="schedule-venue-card">
                            <div className="d-flex align-items-start">
                              <i className="bi bi-geo-alt-fill text-success me-2 mt-1 flex-shrink-0"></i>
                              <div>
                                <p className="fw-bold mb-1">
                                  Barangay Borabod Covered Court
                                </p>
                                <p className="fs-4">
                                  Barangay Borabod, Daet, Camarines Norte
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="fw-bold small mb-3">
                            Clients are kindly advised to follow the schedule
                            below:
                          </p>

                          {/* Schedule List */}
                          <div className="mb-4">
                            {/* March 11 */}
                            <div className="schedule-item">
                              <div className="schedule-date-badge">11</div>
                              <div className="schedule-details">
                                <div className="schedule-day">
                                  March 11, 2026 (Wednesday)
                                </div>
                                <div className="schedule-time">
                                  <i className="bi bi-clock schedule-icon"></i>
                                  <span>8:00 AM – 4:30 PM</span>
                                </div>
                                <div className="schedule-limit">
                                  <i className="bi bi-people schedule-icon"></i>
                                  <span>First 796 clients only</span>
                                </div>
                              </div>
                            </div>

                            {/* March 12 */}
                            <div className="schedule-item">
                              <div className="schedule-date-badge">12</div>
                              <div className="schedule-details">
                                <div className="schedule-day">
                                  March 12, 2026 (Thursday)
                                </div>
                                <div className="schedule-time">
                                  <i className="bi bi-clock schedule-icon"></i>
                                  <span>8:00 AM – 4:30 PM</span>
                                </div>
                                <div className="schedule-limit">
                                  <i className="bi bi-people schedule-icon"></i>
                                  <span>First 797 clients only</span>
                                </div>
                              </div>
                            </div>

                            {/* March 13 */}
                            <div className="schedule-item">
                              <div className="schedule-date-badge">13</div>
                              <div className="schedule-details">
                                <div className="schedule-day">
                                  March 13, 2026 (Friday)
                                </div>
                                <div className="schedule-time">
                                  <i className="bi bi-clock schedule-icon"></i>
                                  <span>8:00 AM – 4:30 PM</span>
                                </div>
                                <div className="schedule-limit">
                                  <i className="bi bi-people schedule-icon"></i>
                                  <span>First 797 clients only</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Important Reminder */}
                          <div className="schedule-reminder">
                            <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
                            <p className="schedule-reminder-text">
                              Kindly arrive on time and bring all the required
                              documents to ensure a smooth and efficient
                              validation process.
                            </p>
                          </div>
                        </div>
                        <p className="modal-text fs-5 mt-4">
                          Once again, congratulations, and we wish you continued
                          success and support through this program.
                        </p>

                        <hr className="my-4" />

                        <p className="text-muted mb-0 text-center">
                          <i className="bi bi-clock me-2"></i>
                          {result.timestamp}
                        </p>
                      </Card.Body>
                    </Card>
                  </Modal.Body>
                  <Modal.Footer className="modern-modal-footer">
                    <Button
                      variant="outline-success"
                      onClick={handleShowRequirements}
                      size="lg"
                    >
                      <i className="bi bi-file-text me-2"></i>
                      Requirements
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleNewSearch}
                      size="lg"
                    >
                      <i className="bi bi-search me-2"></i>
                      New Search
                    </Button>
                  </Modal.Footer>
                </>
              ) : result && !result.exists ? (
                // Not Found Modal
                <>
                  <Modal.Header className="modal-error-header text-white">
                    <Modal.Title className="w-100 text-center text-uppercase">
                      Verification Result
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="p-4">
                    <div className="text-center mb-4">
                      <i
                        className="bi bi-x-circle-fill"
                        style={{ fontSize: "4rem", color: "#c62828" }}
                      ></i>
                    </div>

                    <Card className="error-message-card">
                      <Card.Body className="text-center p-4">
                        <h3 className="mb-3 text-uppercase fw-bold">
                          {result.fullName}
                        </h3>

                        {result.birthday && (
                          <p className="mb-3">
                            <strong>Born:</strong> {result.birthday}
                          </p>
                        )}

                        <h4 className="text-danger mb-4">
                          We regret to inform you that the information provided
                          does not appear in our current list of beneficiaries.
                        </h4>

                        <p className="text-muted modal-text">
                          <i className="bi bi-info-circle me-2"></i>
                          If the student is a minor, please try searching using
                          the name of the parent or guardian indicated and
                          submitted through digital application form.
                        </p>

                        <p className="text-muted modal-text">
                          <i className="bi bi-info-circle me-2"></i>
                          This may be due to the limited number of beneficiaries
                          accommodated for this assistance program, or because
                          the applicant may have already availed educational
                          assistance from another program, department, or
                          institution. We encourage you to stay updated for
                          future opportunities and announcements.
                        </p>

                        <p className="text-muted modal-text mt-2">
                          <i className="bi bi-info-circle me-2"></i>
                          You may also verify the spelling of your name or try
                          searching again using different name combinations.
                        </p>

                        <p className="text-muted modal-text mt-3">
                          <i className="bi bi-envelope me-2"></i>
                          If you have questions or require further
                          clarification, you may send your inquiries to{" "}
                          <strong>akapaics2nddistcn@gmail.com</strong>.
                        </p>

                        <p className="text-muted modal-text mt-3">
                          <i className="bi bi-clock me-2"></i>
                          {result.timestamp}
                        </p>
                      </Card.Body>
                    </Card>
                  </Modal.Body>
                  <Modal.Footer className="modern-modal-footer">
                    <Button
                      variant="danger"
                      onClick={handleNewSearch}
                      size="lg"
                    >
                      <i className="bi bi-search me-2"></i>
                      Try Again
                    </Button>
                  </Modal.Footer>
                </>
              ) : null}
            </Modal>
            {/* Requirements Modal */}
            <Modal
              show={showRequirementsModal}
              onHide={handleCloseRequirements}
              centered
              size="lg"
              backdrop="static"
            >
              <Modal.Header className="modal-success-header text-white">
                <Modal.Title className="w-100">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <span className="text-uppercase fs-3 fs-md-2 text-center text-md-start">
                      Requirements for Beneficiaries
                    </span>
                    <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 p-2 rounded-3">
                      <span
                        className={`fs-6 ${!isTagalog ? "text-white-50" : "text-white fw-bold"}`}
                      >
                        <span className="d-none d-sm-inline">🇵🇭</span> Tagalog
                      </span>
                      <Form.Check
                        type="switch"
                        id="language-switch"
                        checked={!isTagalog}
                        onChange={() => setIsTagalog(!isTagalog)}
                        className="language-switch mx-1"
                      />
                      <span
                        className={`fs-6 ${isTagalog ? "text-white-50" : "text-white fw-bold"}`}
                      >
                        <span className="d-none d-sm-inline">🇬🇧</span> English
                      </span>
                    </div>
                  </div>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-3 p-md-4">
                <Card className="border-0">
                  <Card.Body className="p-3 p-md-4">
                    {isTagalog ? (
                      /* ===== TAGALOG VERSION ===== */
                      <>
                        {/* Requirements for Students - Tagalog */}
                        <div className="mb-5">
                          <h4 className="text-success fw-bold mb-3 fs-5 fs-md-4">
                            <i className="bi bi-person-video3 me-2"></i>
                            Requirement para sa mga Mag-aaral (Bilang Kliyente)
                          </h4>
                          <p className="text-muted mb-3 small">
                            Mangyaring ihanda at isumite ang mga sumusunod na
                            dokumento:
                          </p>

                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  Tatlong (3) back-to-back na photocopy ng valid
                                  government-issued ID, mas mabuti kung National
                                  ID.
                                </span>
                              </div>

                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-3 ms-md-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2 small">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Mga Tinatanggap na Government ID:
                                </h6>
                                <div className="row g-2">
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Philippine Postal ID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>

                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  <strong>
                                    Tatlong (3) back-to-back na photocopy
                                  </strong>{" "}
                                  ng validated School ID para sa 2nd Semester,
                                  Academic Year 2025–2026.{" "}
                                  {/*, kasama ang{" "}
                                 <strong>isang (1) Certified True Copy</strong>{" "}
                                  na inisyu ng Registrar na may orihinal na
                                  pirma.*/}
                                </span>
                              </div>
                            </li>
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  <strong>
                                    Isang (1) Orihinal na Registration Form
                                  </strong>{" "}
                                  para sa 2nd Semester, Academic Year 2025–2026,
                                  na may orihinal na pirma ng Registrar.
                                </span>
                              </div>
                            </li>
                            <li className="mb-3 text-center">
                              <span className="px-3 py-1 small fw-bold fs-4">
                                OR
                              </span>
                            </li>
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  <strong>
                                    Isang (1) Orihinal na Certificate of
                                    Enrollment
                                  </strong>{" "}
                                  na nagsasaad ng 2nd Semester, Academic Year
                                  2025–2026, na may layuning nakasaad na{" "}
                                  <span className="fst-italic">
                                    "Educational Assistance"
                                  </span>{" "}
                                  at may orihinal na pirma ng Registrar.
                                </span>
                              </div>
                            </li>
                          </ul>

                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 mt-2">
                            <div className="d-flex">
                              <i className="bi bi-exclamation-triangle-fill text-warning me-3 flex-shrink-0"></i>
                              <span className="small text-dark">
                                Kung magsusumite ng Certificate of Enrollment,
                                siguraduhing ito ay opisyal na selyado, lalo na
                                kung ang dokumento ay nagsasaad ng{" "}
                                <span className="fst-italic">
                                  "Not Valid Without Seal."
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Requirements for Parent/Guardian - Tagalog */}
                        <div className="mb-5">
                          <h4 className="text-success fw-bold mb-3 fs-5 fs-md-4">
                            <i className="bi bi-people me-2"></i>
                            Requirement para sa Awtorisadong
                            Magulang/Tagapangalaga
                          </h4>
                          <p className="text-muted mb-3 small">
                            <small className="text-muted">
                              (Nakalista bilang Kliyente – Para sa Minor na
                              Mag-aaral/Awtorisado)
                            </small>
                          </p>
                          <p className="text-muted mb-3 small">
                            Para sa mga mag-aaral na kinakatawan ng awtorisadong
                            magulang o tagapangalaga, mangyaring isumite ang mga
                            sumusunod:
                          </p>

                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  Tatlong (3) back-to-back na photocopy ng valid
                                  government-issued ID ng{" "}
                                  <strong>
                                    Awtorisadong Magulang/Tagapangalaga
                                  </strong>
                                  , mas mabuti kung National ID.
                                </span>
                              </div>

                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-3 ms-md-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2 small">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Mga Tinatanggap na Government ID:
                                </h6>
                                <div className="row g-2">
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                      <li>
                                          <i className="bi bi-dot text-success me-2"></i>
                                        Philippine Postal ID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>

                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  Tatlong (3) back-to-back na photocopy ng valid
                                  government-issued ID ng{" "}
                                  <strong>Mag-aaral</strong>, mas mabuti kung
                                  National ID.
                                </span>
                              </div>

                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-3 ms-md-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2 small">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Mga Tinatanggap na Government ID:
                                </h6>
                                <div className="row g-2">
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                       <li>
                                          <i className="bi bi-dot text-success me-2"></i>
                                        Philippine Postal ID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-12 col-sm-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1 small">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>

                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  Tatlong (3) back-to-back na photocopy ng
                                  validated School ID ng Mag-aaral para sa 2nd
                                  Semester, Academic Year 2025–2026.{" "}
                                  {/*, kasama ang
                                  isang (1) Certified True Copy na inisyu ng
                                  Registrar na may orihinal na pirmaa. */}
                                </span>
                              </div>
                            </li>
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  <strong>
                                    Isang (1) Orihinal na Registration Form
                                  </strong>{" "}
                                  ng Mag-aaral para sa 2nd Semester, Academic
                                  Year 2025–2026, na may orihinal na pirma ng
                                  Registrar.
                                </span>
                              </div>
                            </li>
                            <li className="mb-3 text-center">
                              <span className="px-3 py-1 small fw-bold fs-4">
                                OR
                              </span>
                            </li>
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  <strong>
                                    Isang (1) Orihinal na Certificate of
                                    Enrollment
                                  </strong>{" "}
                                  ng Mag-aaral na nagsasaad ng 2nd Semester,
                                  Academic Year 2025–2026, na may purpose na{" "}
                                  <span className="fst-italic">
                                    "Educational Assistance"
                                  </span>
                                  , at may orihinal na pirma ng Registrar.
                                </span>
                              </div>
                            </li>
                            <li className="mb-3">
                              <div className="d-flex">
                                <i className="bi bi-check-circle-fill text-success me-3 flex-shrink-0 mt-1"></i>
                                <span className="small">
                                  Kung ang tagapangalaga ay hindi magulang o
                                  kapatid ng mag-aaral, mangyaring maghanda ng
                                  Authorization Letter na nagsasaad na ang
                                  kliyente ay awtorisadong kumuha at/o magsumite
                                  ng mga dokumento para sa mag-aaral. Ang liham
                                  ay dapat may pirma ng mag-aaral sa ibabaw ng
                                  kanyang pangalan.
                                </span>
                              </div>
                            </li>
                          </ul>

                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 mt-2">
                            <div className="d-flex">
                              <i className="bi bi-exclamation-triangle-fill text-warning me-3 flex-shrink-0"></i>
                              <span className="small text-dark">
                                Kung magsusumite ng Certificate of Enrollment,
                                siguraduhing ito ay opisyal na selyado, lalo na
                                kung ang dokumento ay nagsasaad ng{" "}
                                <span className="fst-italic">
                                  "Not Valid Without Seal."
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Senior High School Note - Tagalog */}
                        <div className="mb-4">
                          <h5 className="text-success fw-bold mb-3 small">
                            Para sa mga Mag-aaral ng Senior High School:
                          </h5>
                          <div className="bg-light p-3 p-md-4 rounded-3">
                            <div className="d-flex">
                              <i className="bi bi-info-circle-fill text-success me-3 flex-shrink-0"></i>
                              <p className="mb-0 small">
                                Kung magsusumite ng Certificate of Enrollment,
                                siguraduhing malinaw na nakasaad dito ang{" "}
                                <strong>Second Semester, A.Y. 2025–2026</strong>{" "}
                                o nagsasaad ng{" "}
                                <span className="fst-italic">
                                  "Currently Enrolled."
                                </span>{" "}
                                Ang sertipiko ay dapat may nakasaad na layuning{" "}
                                <span className="fst-italic">
                                  "Educational Assistance"
                                </span>{" "}
                                at may orihinal na pirma ng Registrar o
                                releasing officer.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-light p-4 rounded-3">
                          <p className="mb-0">
                            <i className="bi bi-info-circle-fill text-success me-2"></i>
                            Tanging ang nakatalang magulang, tagapag-alaga, o
                            custodian na nakalista sa{" "}
                            <strong className="text-uppercase">
                              talaan ng mga kliyente
                            </strong>{" "}
                            ang pinapayagang maging awtorisadong kinatawan.{" "}
                            <strong className="text-uppercase">
                              Ang agarang pag-awtorisa at pagpapalit
                            </strong>{" "}
                            ng nakatalang kliyente{" "}
                            <strong className="text-uppercase">
                              ay hindi pinapayagan
                            </strong>
                            &nbsp;sa panahon ng validation at processing.
                            Hinihiling po namin sa lahat na tiyaking ang tamang
                            awtorisadong tao ang makadalo sa nakatakdang
                            proseso. Maraming salamat po sa inyong kooperasyon.
                          </p>
                        </div>

                        {/* Reminder - Tagalog */}
                        <div className="bg-success bg-opacity-10 p-3 p-md-4 rounded-3 mt-5">
                          <h6 className="text-success fw-bold mb-3 small">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            Mahalagang Paalala:
                          </h6>
                          <div className="d-flex">
                            <p className="mb-0 text-dark small">
                              Ang lahat ng photocopy ay dapat{" "}
                              <strong>back-to-back</strong> upang makatipid sa
                              paggamit ng papel. Mangyaring tiyakin na kumpleto
                              at maayos na nakaayos ang lahat ng dokumento bago
                              isumite.{" "}
                              <strong className="text-uppercase text-danger">
                                {" "}
                                Ang hindi kumpleto o maling mga requirements ay
                                maaaring magdulot ng pagkaantala sa pagproseso
                                ng inyong aplikasyon at maaaring maging dahilan
                                ng pagkaka-disqualify sa educational assistance.
                              </strong>
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ===== ENGLISH VERSION ===== */
                      <>
                        {/* Requirements for Students - English */}
                        <div className="mb-5">
                          <h4 className="text-success fw-bold mb-3">
                            <i className="bi bi-person-video3 me-2"></i>
                            Requirements for Students (as Client)
                          </h4>
                          <p className="text-muted mb-3">
                            Please prepare and submit the following documents:
                          </p>

                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              Three (3) back-to-back photocopies of a valid
                              government-issued ID, preferably the National ID.
                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Acceptable Government IDs:
                                </h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                       <li>
                                          <i className="bi bi-dot text-success me-2"></i>
                                        Philippine Postal ID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>                             
                            </li>

                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              <strong>
                                Three (3) back-to-back photocopies{" "}
                              </strong>{" "}
                              of a validated School ID for Second Semester,
                              Academic Year 2025–2026 .
                              {/*, together with{" "}
                              <strong>one (1) Certified True Copy </strong>{" "}
                              issued by the Registrar bearing the original
                              signature. */}
                            </li>
                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              <strong>
                                One (1) Original Registration Form
                              </strong>{" "}
                              for Second Semester, Academic Year 2025–2026, with
                              the original signature of the Registrar.
                            </li>
                            <li className="mb-3 text-center fs-3">
                              <strong className="text-uppercase">OR</strong>
                            </li>
                            <li className="mb-3">
                              <strong>
                                One (1) Original Certificate of Enrollment
                              </strong>{" "}
                              indicating Second Semester, Academic Year
                              2025–2026, with the purpose stated as{" "}
                              <span className="fst-italic">
                                "Educational Assistance"
                              </span>{" "}
                              and bearing the original signature of the
                              Registrar.
                            </li>
                          </ul>

                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 mt-2">
                            <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                            <span className="text-dark">
                              If a Certificate of Enrollment is submitted,
                              please ensure that it is officially sealed,
                              especially if the document indicates{" "}
                              <span className="fst-italic">
                                "Not Valid Without Seal."
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Requirements for Parent/Guardian - English */}
                        <div className="mb-5">
                          <h4 className="text-success fw-bold mb-3">
                            <i className="bi bi-people me-2"></i>
                            Requirements for Authorized Parent/Guardian <br />
                            <small className="text-muted fs-6">
                              (Listed as Client – For Minor Students/Authorized)
                            </small>
                          </h4>
                          <p className="text-muted mb-3">
                            For students represented by an authorized parent or
                            guardian, please submit the following:
                          </p>

                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              Three (3) back-to-back photocopies of a valid
                              government-issued ID of the{" "}
                              <strong>Authorized Parent/Guardian</strong>,
                              preferably the National ID.
                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Acceptable Government IDs:
                                </h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>

                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              Three (3) back-to-back photocopies of a valid
                              government-issued ID of the{" "}
                              <strong>Student</strong>, preferably the National
                              ID.
                              {/* Acceptable IDs Section */}
                              <div className="mt-3 ms-4 p-3 bg-light rounded-3">
                                <h6 className="text-success fw-bold mb-2">
                                  <i className="bi bi-card-checklist me-2"></i>
                                  Acceptable Government IDs:
                                </h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        National ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Passport
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Driver's License
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        UMID
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="col-md-6">
                                    <ul className="list-unstyled mb-0">
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Senior Citizen ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        PWD ID
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Police Clearance
                                      </li>
                                      <li className="mb-1">
                                        <i className="bi bi-dot text-success me-2"></i>
                                        Voter's Certification
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </li>

                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              Three (3) back-to-back photocopies of a validated
                              School ID of the Student for Second Semester,
                              Academic Year 2025–2026 .
                              {/*, together with one (1)
                              Certified True Copy issued by the Registrar
                              bearing the original signature. */}
                            </li>
                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              <strong>
                                One (1) Original Registration Form
                              </strong>{" "}
                              of the Student for Second Semester, Academic Year
                              2025–2026, with the original signature of the
                              Registrar.
                            </li>
                            <li className="mb-3 text-center fs-3">
                              <strong className="text-uppercase">OR</strong>
                            </li>
                            <li className="mb-3">
                              <strong>
                                One (1) Original Certificate of Enrollment
                              </strong>{" "}
                              of the Student indicating Second Semester,
                              Academic Year 2025–2026, with the purpose stated
                              as{" "}
                              <span className="fst-italic">
                                "Educational Assistance"
                              </span>
                              , and bearing the original signature of the
                              Registrar.
                            </li>
                            <li className="mb-3">
                              <i className="bi bi-check-circle-fill text-success me-3"></i>
                              If the custodian or guardian is not the parent or
                              sibling of the student, please prepare an
                              Authorization Letter indicating that the client is
                              authorized to claim and/or submit the documents on
                              behalf of the student. The letter must include the
                              student’s signature over printed name.
                            </li>
                          </ul>

                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 mt-2">
                            <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                            <span className="text-dark">
                              If a Certificate of Enrollment is submitted,
                              please ensure that it is officially sealed,
                              especially if the document indicates{" "}
                              <span className="fst-italic">
                                "Not Valid Without Seal."
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Senior High School Note - English */}
                        <div className="mb-4">
                          <h5 className="text-success fw-bold mb-3">
                            For Senior High School Students:
                          </h5>
                          <div className="bg-light p-4 rounded-3">
                            <p className="mb-0">
                              <i className="bi bi-info-circle-fill text-success me-2"></i>
                              If submitting a Certificate of Enrollment, please
                              ensure that it clearly indicates{" "}
                              <strong> Second Semester, A.Y. 2025–2026</strong>{" "}
                              or states{" "}
                              <span className="fst-italic">
                                "Currently Enrolled."
                              </span>{" "}
                              The certificate must include the purpose{" "}
                              <span className="fst-italic">
                                "Educational Assistance"
                              </span>{" "}
                              and must bear the original signature of the
                              Registrar or releasing officer.
                            </p>
                          </div>
                        </div>

                        <div className="bg-light p-4 rounded-3">
                          <p className="mb-0">
                            <i className="bi bi-info-circle-fill text-success me-2"></i>
                            Only the listed parent, guardian, or custodian
                            indicated in the{" "}
                            <strong className="text-uppercase">
                              client list
                            </strong>{" "}
                            will be allowed to act as the authorized
                            representative.{" "}
                            <strong className="text-uppercase">
                              On-the-spot authorization and replacement
                            </strong>{" "}
                            of the listed client{" "}
                            <strong className="text-uppercase">
                              will not be permitted
                            </strong>
                            &nbsp;during the validation and processing period.
                            We kindly ask everyone to ensure that the correct
                            and authorized person is present during the
                            scheduled process. Thank you for your cooperation.
                          </p>
                        </div>

                        {/* Reminder - English */}
                        <div className="bg-success bg-opacity-10 p-4 rounded-3 mt-5">
                          <h6 className="text-success fw-bold mb-3">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            Important Reminder:
                          </h6>
                          <p className="mb-0 text-dark">
                            All photocopies should be{" "}
                            <strong>back-to-back</strong> to minimize paper
                            usage. Please ensure that all documents are complete
                            and properly organized before submission.{" "}
                            <strong className="text-uppercase text-danger">
                              Incomplete or incorrect requirements may cause
                              delays in the processing of your application and
                              may result in disqualification from the grant.
                            </strong>
                          </p>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Modal.Body>
              <Modal.Footer className="modern-modal-footer d-flex flex-column">
                {/* Checkbox Section */}
                <div className="w-100 mb-3">
                  <div className="d-flex align-items-start justify-content-center">
                    <Form.Check
                      type="checkbox"
                      id="understand-checkbox"
                      checked={hasAgreed}
                      onChange={(e) => setHasAgreed(e.target.checked)}
                      className="me-2"
                      style={{ cursor: "pointer" }}
                    />
                    <label
                      htmlFor="understand-checkbox"
                      className="text-muted small cursor-pointer"
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {isTagalog ? (
                        <>
                          Naiintindihan ko ang lahat ng requirements na
                          kailangan ipasa.
                        </>
                      ) : (
                        <>
                          I understand the necessary requirements that need to
                          be submitted.
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Button Section */}
                <div className="w-100 d-flex justify-content-center">
                  <Button
                    variant="success"
                    onClick={handleCloseRequirements}
                    size="lg"
                    className={`px-3 px-md-5 w-100 w-md-auto ${!hasAgreed ? "opacity-50" : ""}`}
                    disabled={!hasAgreed}
                  >
                    {isTagalog ? "Naiintindihan Ko" : "Got it"}
                  </Button>
                </div>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
