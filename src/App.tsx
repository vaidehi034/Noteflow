import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  auth,
} from "./firebase";

import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
} from "./authService";

import {
  addNote,
  listenToNotes,
  removeNote,
  addAssignment,
  listenToAssignments,
  toggleAssignment,
  removeAssignment,
  type StudyNote,
  type Assignment,
} from "./studyService";

import "./App.css";

type Tab = "overview" | "notes" | "assignments";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dataError, setDataError] = useState("");

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("General");
  const [noteContent, setNoteContent] = useState("");

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setAssignments([]);
      return;
    }

    setDataError("");

    const unsubscribeNotes = listenToNotes(
      user.uid,
      setNotes,
      (error) => setDataError(error.message)
    );

    const unsubscribeAssignments = listenToAssignments(
      user.uid,
      setAssignments,
      (error) => setDataError(error.message)
    );

    return () => {
      unsubscribeNotes();
      unsubscribeAssignments();
    };
  }, [user]);

  async function handleAuthSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    try {
      if (isRegistering) {
        await registerUser(name.trim(), email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";

      const messages: Record<string, string> = {
        "auth/email-already-in-use": "This email already has an account.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Use a stronger password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/network-request-failed": "Check your internet connection.",
      };

      setAuthMessage(messages[code] ?? `Unable to sign in: ${code || "Unknown error"}`);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setAuthMessage("Enter your email address first.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setAuthMessage("If the account exists, a password-reset email will be sent.");
    } catch {
      setAuthMessage("Unable to send the reset email. Check your email address.");
    }
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setActionMessage("");

    try {
      await addNote(
        user.uid,
        noteTitle.trim(),
        noteContent.trim(),
        noteSubject
      );

      setNoteTitle("");
      setNoteContent("");
      setNoteSubject("General");
      setShowNoteForm(false);
      setActionMessage("Note saved successfully.");
    } catch (error) {
      setActionMessage(
        `Could not save note: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAssignment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setActionMessage("");

    try {
      await addAssignment(
        user.uid,
        assignmentTitle.trim(),
        assignmentSubject.trim(),
        assignmentDueDate
      );

      setAssignmentTitle("");
      setAssignmentSubject("");
      setAssignmentDueDate("");
      setShowAssignmentForm(false);
      setActionMessage("Assignment added successfully.");
    } catch (error) {
      setActionMessage(
        `Could not add assignment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote(id: string) {
    if (!window.confirm("Delete this note permanently?")) return;

    try {
      await removeNote(id);
      setActionMessage("Note deleted.");
    } catch (error) {
      setActionMessage(
        `Could not delete note: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!window.confirm("Delete this assignment permanently?")) return;

    try {
      await removeAssignment(id);
      setActionMessage("Assignment deleted.");
    } catch (error) {
      setActionMessage(
        `Could not delete assignment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async function handleToggleAssignment(item: Assignment) {
    try {
      await toggleAssignment(item.id, !item.completed);
    } catch (error) {
      setActionMessage(
        `Could not update assignment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">N.</div>
        <p>Preparing your workspace...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand">NoteFlow<span>.</span></div>
          <p className="eyebrow">YOUR PERSONAL STUDY SPACE</p>

          <h1>
            {isRegistering ? "Start fresh." : "Your semester."}
            <br />
            <span>
              {isRegistering ? "Stay organized." : "Under control."}
            </span>
          </h1>

          <p className="subtitle">
            Your notes, assignments, and study plans in one place.
          </p>

          <form onSubmit={handleAuthSubmit}>
            {isRegistering && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>

            {!isRegistering && (
              <button
                type="button"
                className="text-button"
                onClick={handleResetPassword}
              >
                Forgot password?
              </button>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : isRegistering
                  ? "Create account →"
                  : "Sign in →"}
            </button>
          </form>

          {authMessage && (
            <p className="message" role="status">{authMessage}</p>
          )}

          <p className="switch-mode">
            {isRegistering
              ? "Already have an account?"
              : "New to NoteFlow?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthMessage("");
              }}
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </p>

          <p className="footer-note">
            Your workspace. Your progress. Your future.
          </p>
        </section>
      </main>
    );
  }

  const completedCount = assignments.filter((item) => item.completed).length;
  const pendingCount = assignments.length - completedCount;
  const progress = assignments.length
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;

  const today = new Date().toISOString().slice(0, 10);

  const upcomingAssignments = assignments
    .filter((item) => !item.completed)
    .slice(0, 4);

  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content} ${note.subject}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredAssignments = assignments.filter((item) =>
    `${item.title} ${item.subject}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="brand dashboard-brand">NoteFlow<span>.</span></div>

        <p className="sidebar-label">WORKSPACE</p>

        <button
          className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span>◫</span> Overview
        </button>

        <button
          className={`nav-item ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <span>▤</span> My Notes
          <span className="nav-count">{notes.length}</span>
        </button>

        <button
          className={`nav-item ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          <span>☷</span> Assignments
          <span className="nav-count">{pendingCount}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="user-avatar">
            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <strong>{user.displayName || "Student"}</strong>
            <span>{user.email}</span>
          </div>
          <button
            className="logout-button"
            title="Sign out"
            onClick={() => void logoutUser()}
          >
            ↗
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
            <p className="topbar-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="live-indicator">
              <span className="live-dot" /> Live sync
            </div>
            <button
              className="top-add-button"
              onClick={() => {
                setActiveTab("notes");
                setShowNoteForm(true);
                setActionMessage("");
              }}
            >
              + New note
            </button>
          </div>
        </header>

        <div className="welcome-row">
          <div>
            <h1>
              {activeTab === "overview"
                ? `Welcome back, ${(user.displayName || "Student").split(" ")[0]}.`
                : activeTab === "notes"
                  ? "Your notes."
                  : "Your assignments."}
            </h1>
            <p className="subtitle">
              {activeTab === "overview"
                ? "A clearer mind starts with an organized workspace."
                : activeTab === "notes"
                  ? "Capture ideas before your brain files them into the void."
                  : "Know what's due, and stop letting deadlines surprise you."}
            </p>
          </div>
        </div>

        {dataError && (
          <div className="alert error-alert">
            <strong>Database connection issue:</strong> {dataError}
            <p>Check your Firestore database rules in Firebase Console.</p>
          </div>
        )}

        {actionMessage && (
          <div className="alert" role="status">
            {actionMessage}
            <button onClick={() => setActionMessage("")}>×</button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon purple-icon">▤</span>
                  <span className="stat-caption">YOUR KNOWLEDGE</span>
                </div>
                <h2>{notes.length}</h2>
                <p>Total notes saved</p>
                <div className="stat-bottom">Ideas, organized.</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon orange-icon">◷</span>
                  <span className="stat-caption">ON YOUR RADAR</span>
                </div>
                <h2>{pendingCount}</h2>
                <p>Pending assignments</p>
                <div className="stat-bottom">
                  {pendingCount ? "One step at a time." : "Nothing pending. Nice."}
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span className="stat-icon green-icon">✓</span>
                  <span className="stat-caption">PROGRESS</span>
                </div>
                <h2>{progress}%</h2>
                <p>Assignments completed</p>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </article>
            </div>

            <div className="content-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent notes</h2>
                    <p>Your latest thoughts and study material</p>
                  </div>
                  <button className="subtle-button" onClick={() => setActiveTab("notes")}>
                    View all →
                  </button>
                </div>

                {notes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✎</div>
                    <h3>Your first note starts here</h3>
                    <p>Save a concept, a lecture summary, or an idea.</p>
                    <button
                      className="primary-button compact-button"
                      onClick={() => {
                        setActiveTab("notes");
                        setShowNoteForm(true);
                      }}
                    >
                      + Create a note
                    </button>
                  </div>
                ) : (
                  <div className="note-list">
                    {notes.slice(0, 3).map((note) => (
                      <article className="note-row" key={note.id}>
                        <div className="note-mark">N</div>
                        <div className="row-copy">
                          <strong>{note.title}</strong>
                          <p>{note.content.slice(0, 95) || "No note content."}</p>
                          <span className="tag">{note.subject}</span>
                        </div>
                        <button
                          className="delete-button"
                          title="Delete note"
                          onClick={() => void handleDeleteNote(note.id)}
                        >
                          ×
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Up next</h2>
                    <p>Your pending assignments</p>
                  </div>
                  <button
                    className="subtle-button"
                    onClick={() => setActiveTab("assignments")}
                  >
                    View all →
                  </button>
                </div>

                {upcomingAssignments.length === 0 ? (
                  <div className="empty-state small-empty">
                    <div className="empty-icon">✓</div>
                    <h3>Room to breathe</h3>
                    <p>No pending assignments yet.</p>
                    <button
                      className="primary-button compact-button"
                      onClick={() => {
                        setActiveTab("assignments");
                        setShowAssignmentForm(true);
                      }}
                    >
                      + Add assignment
                    </button>
                  </div>
                ) : (
                  <div className="assignment-list">
                    {upcomingAssignments.map((item) => (
                      <article className="assignment-row" key={item.id}>
                        <button
                          className="check-button"
                          title="Mark complete"
                          onClick={() => void handleToggleAssignment(item)}
                        >
                          ✓
                        </button>
                        <div className="row-copy">
                          <strong>{item.title}</strong>
                          <p>{item.subject}</p>
                          <span className={`due-label ${item.dueDate < today ? "overdue" : ""}`}>
                            {item.dueDate < today
                              ? "Overdue · "
                              : "Due · "}
                            {item.dueDate
                              ? new Date(`${item.dueDate}T00:00:00`).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "No date"}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {activeTab === "notes" && (
          <section className="panel full-panel">
            <div className="panel-heading">
              <div>
                <h2>My notes <span className="heading-count">{notes.length}</span></h2>
                <p>Everything worth remembering, in one place.</p>
              </div>
              <button
                className="top-add-button"
                onClick={() => setShowNoteForm(!showNoteForm)}
              >
                {showNoteForm ? "Cancel" : "+ Create note"}
              </button>
            </div>

            {showNoteForm && (
              <form className="editor-form" onSubmit={handleAddNote}>
                <h3>Create a new note</h3>
                <label>
                  Note title
                  <input
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="e.g. Neural networks revision"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Subject
                  <select
                    value={noteSubject}
                    onChange={(event) => setNoteSubject(event.target.value)}
                  >
                    <option>General</option>
                    <option>Artificial Intelligence</option>
                    <option>Machine Learning</option>
                    <option>Data Structures</option>
                    <option>Mathematics</option>
                    <option>Computer Networks</option>
                    <option>Database Management</option>
                    <option>Software Engineering</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Content
                  <textarea
                    value={noteContent}
                    onChange={(event) => setNoteContent(event.target.value)}
                    placeholder="Write your notes here..."
                    rows={5}
                    maxLength={10000}
                    required
                  />
                </label>

                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save note →"}
                </button>
              </form>
            )}

            <input
              className="search-input"
              placeholder="⌕  Search your notes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>{search ? "No matching notes" : "Your notes live here"}</h3>
                <p>
                  {search
                    ? "Try another search term."
                    : "Create your first note to get started."}
                </p>
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map((note) => (
                  <article className="note-card" key={note.id}>
                    <div className="note-card-top">
                      <span className="tag">{note.subject}</span>
                      <button
                        className="delete-button"
                        title="Delete note"
                        onClick={() => void handleDeleteNote(note.id)}
                      >
                        ×
                      </button>
                    </div>
                    <h3>{note.title}</h3>
                    <p className="note-body">{note.content}</p>
                    <div className="note-card-footer">
                      <span>NOTE · NOTEFLOW</span>
                      <span>{note.content.length} characters</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "assignments" && (
          <section className="panel full-panel">
            <div className="panel-heading">
              <div>
                <h2>Assignment tracker <span className="heading-count">{assignments.length}</span></h2>
                <p>Track deadlines and celebrate the finished work.</p>
              </div>
              <button
                className="top-add-button"
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
              >
                {showAssignmentForm ? "Cancel" : "+ Add assignment"}
              </button>
            </div>

            {showAssignmentForm && (
              <form className="editor-form" onSubmit={handleAddAssignment}>
                <h3>Add an assignment</h3>
                <label>
                  Assignment title
                  <input
                    value={assignmentTitle}
                    onChange={(event) => setAssignmentTitle(event.target.value)}
                    placeholder="e.g. Complete ML lab report"
                    maxLength={150}
                    required
                  />
                </label>

                <label>
                  Subject
                  <input
                    value={assignmentSubject}
                    onChange={(event) => setAssignmentSubject(event.target.value)}
                    placeholder="e.g. Machine Learning"
                    maxLength={80}
                    required
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(event) => setAssignmentDueDate(event.target.value)}
                    required
                  />
                </label>

                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Add assignment →"}
                </button>
              </form>
            )}

            <input
              className="search-input"
              placeholder="⌕  Search assignments..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredAssignments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">☷</div>
                <h3>{search ? "No matching assignments" : "No assignments yet"}</h3>
                <p>Add your coursework and keep deadlines visible.</p>
              </div>
            ) : (
              <div className="assignment-table">
                <div className="table-header">
                  <span>ASSIGNMENT</span>
                  <span>SUBJECT</span>
                  <span>DUE DATE</span>
                  <span>STATUS</span>
                  <span>ACTION</span>
                </div>

                {filteredAssignments.map((item) => (
                  <div className="table-row" key={item.id}>
                    <strong className={item.completed ? "completed-title" : ""}>
                      {item.title}
                    </strong>
                    <span>{item.subject}</span>
                    <span className={item.dueDate < today && !item.completed ? "overdue" : ""}>
                      {new Date(`${item.dueDate}T00:00:00`).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      className={`status-pill ${item.completed ? "status-done" : "status-pending"}`}
                      onClick={() => void handleToggleAssignment(item)}
                    >
                      {item.completed ? "Completed ✓" : "Pending"}
                    </button>
                    <button
                      className="delete-button"
                      title="Delete assignment"
                      onClick={() => void handleDeleteAssignment(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="dashboard-footer">
          <span>NOTEFLOW © {new Date().getFullYear()}</span>
          <span>Small steps. Consistent progress.</span>
        </footer>
      </section>
    </main>
  );
}

export default App;