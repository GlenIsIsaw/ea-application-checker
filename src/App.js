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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  // Ref for modal content to trigger confetti
  const modalContentRef = useRef(null);

  // Handler functions for requirements modal
  const handleShowRequirements = () => {
    setShowRequirementsModal(true);
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
        zIndex: 9999,
      });

      // Second burst - left side
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { x: Math.max(0, originX - 0.1), y: originY },
          colors: ["#26ccff", "#a25afd", "#ff5e7d"],
          startVelocity: 20,
          zIndex: 9999,
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
          zIndex: 9999,
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
          zIndex: 9999,
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
        zIndex: 9999,
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
        extension,
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
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          Middle Name{" "}
                          <span className="text-muted">(Optional)</span>
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
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="modern-label">
                          Extension Name{" "}
                          <span className="text-muted">(Optional)</span>
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

                        <p className="modal-text fs-5 mt-4">
                          Please wait for further announcements regarding the
                          next steps and instructions for the beneficiaries.
                        </p>

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
                          the name of the parent or guardian indicated and submitted through
                          digital application form.
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

            {/* Requirements Modal - This is now OUTSIDE the result modal */}
            <Modal
              show={showRequirementsModal}
              onHide={handleCloseRequirements}
              centered
              size="lg"
              backdrop="static"
            >
              <Modal.Header className="modal-success-header text-white">
                <Modal.Title className="w-100 text-center text-uppercase fs-2">
                  Requirements for Beneficiaries
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <Card className="border-0">
                  <Card.Body className="p-4">
                    <h5 className="text-success mb-4">
                      <i className="bi bi-person-check me-2"></i>
                      Personal Documents
                    </h5>
                    <ul className="list-unstyled mb-4">
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Valid Government ID (Passport, Driver's License, UMID,
                        etc.)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Birth Certificate (PSA authenticated)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Barangay Clearance / Certificate of Residency
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Recent 2x2 ID Photos (2 copies)
                      </li>
                    </ul>

                    <h5 className="text-success mb-4 mt-4">
                      <i className="bi bi-house-door me-2"></i>
                      Proof of Residency
                    </h5>
                    <ul className="list-unstyled mb-4">
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Barangay Certificate of Residency (issued within 3
                        months)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Utility Bill (Electricity, Water, Internet) under
                        beneficiary's name
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Voter's Certification or Cedula
                      </li>
                    </ul>

                    <h5 className="text-success mb-4 mt-4">
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Additional Requirements
                    </h5>
                    <ul className="list-unstyled mb-4">
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Application Form (will be provided at the municipal
                        hall)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Certificate of Indigency (if applicable)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        Senior Citizen ID (if applicable)
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        PWD ID (if applicable)
                      </li>
                    </ul>

                    <div className="bg-light p-4 rounded-3 mt-4">
                      <h6 className="text-success mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        Important Reminders:
                      </h6>
                      <p className="mb-2">
                        • Submit all documents in A4 size clear plastic envelope
                      </p>
                      <p className="mb-2">
                        • Bring original copies for verification
                      </p>
                      <p className="mb-2">
                        • Requirements must be submitted within 30 days from
                        verification
                      </p>
                      <p className="mb-0">
                        • Visit your barangay hall for assistance with document
                        preparation
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Modal.Body>
              <Modal.Footer className="modern-modal-footer">
                <Button
                  variant="success"
                  onClick={handleCloseRequirements}
                  size="lg"
                  className="px-5"
                >
                  Got it
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;