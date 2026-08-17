"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const ELECTION_STORAGE_KEY = "hoh_ballot_system_state";

const DEFAULT_STATE = {
  accredited: [],
  votedIds: [],
  votes: {
    Kosi: 0,
    Augustine: 0,
  },
};

const fetchElectionState = async () => {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const saved = localStorage.getItem(ELECTION_STORAGE_KEY);

    if (!saved) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(saved);

    return {
      accredited: Array.isArray(parsed.accredited)
        ? parsed.accredited
        : [],
      votedIds: Array.isArray(parsed.votedIds)
        ? parsed.votedIds
        : [],
      votes: {
        Kosi: Number(parsed.votes?.Kosi || 0),
        Augustine: Number(parsed.votes?.Augustine || 0),
      },
    };
  } catch (error) {
    console.error("Unable to read election data:", error);
    return DEFAULT_STATE;
  }
};

export default function VotingPage() {
  const queryClient = useQueryClient();

  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [voterIdInput, setVoterIdInput] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");

  const {
    data: election = DEFAULT_STATE,
    isLoading,
  } = useQuery({
    queryKey: ["electionData"],
    queryFn: fetchElectionState,
  });

  /* =========================
     GENERATE VOTER ID
  ========================= */

  const generateIdMutation = useMutation({
    mutationFn: async () => {
      const currentState = await fetchElectionState();

      const newId =
        "HOH-" +
        Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase();

      const updatedState = {
        ...currentState,
        accredited: [
          ...currentState.accredited,
          {
            name: voterName.trim(),
            email: voterEmail.trim(),
            id: newId,
          },
        ],
      };

      localStorage.setItem(
        ELECTION_STORAGE_KEY,
        JSON.stringify(updatedState)
      );

      return {
        state: updatedState,
        token: newId,
      };
    },

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["electionData"],
        data.state
      );

      setGeneratedToken(data.token);
      setVoterName("");
      setVoterEmail("");
      setSubmissionError("");
    },

    onError: () => {
      setSubmissionError(
        "Unable to generate your voting ID. Please try again."
      );
    },
  });

  /* =========================
     CAST VOTE
  ========================= */

  const voteMutation = useMutation({
    mutationFn: async (candidate) => {
      const currentState = await fetchElectionState();

      const cleanId = voterIdInput
        .trim()
        .toUpperCase();

      const tokenExists = currentState.accredited.some(
        (voter) => voter.id === cleanId
      );

      if (!tokenExists) {
        throw new Error(
          "Access Denied: This Unique ID number is not registered."
        );
      }

      if (currentState.votedIds.includes(cleanId)) {
        throw new Error(
          "Security Lockout: This ID key has already cast a vote."
        );
      }

      const updatedState = {
        ...currentState,

        votes: {
          ...currentState.votes,
          [candidate]:
            currentState.votes[candidate] + 1,
        },

        votedIds: [
          ...currentState.votedIds,
          cleanId,
        ],
      };

      localStorage.setItem(
        ELECTION_STORAGE_KEY,
        JSON.stringify(updatedState)
      );

      return updatedState;
    },

    onSuccess: (updatedState) => {
      queryClient.setQueryData(
        ["electionData"],
        updatedState
      );

      setVoterIdInput("");
      setSubmissionError("");

      alert(
        "Your vote is successful!"
      );
    },

    onError: (error) => {
      setSubmissionError(error.message);
    },
  });

  /* =========================
     CALCULATIONS
  ========================= */

  const totalVotes =
    election.votes.Kosi +
    election.votes.Augustine;

  const totalAccredited =
    election.accredited.length;

  const totalUsedIds =
    election.votedIds.length;

  const totalUnusedIds =
    Math.max(
      totalAccredited - totalUsedIds,
      0
    );

  const turnoutPercentage =
    totalAccredited > 0
      ? Math.round(
          (totalVotes / totalAccredited) * 100
        )
      : 0;

  const isGenerationFormValid =
    voterName.trim().length > 0 &&
    voterEmail.trim().includes("@");

  const cleanInputId =
    voterIdInput.trim().toUpperCase();

  const isInputCodeValid =
    election.accredited.some(
      (voter) => voter.id === cleanInputId
    );

  const hasAlreadyVoted =
    election.votedIds.includes(cleanInputId);

  const isVoteInputValid =
    isInputCodeValid &&
    !hasAlreadyVoted;

  /* =========================
     WINNER STATUS
  ========================= */

  let winnerBanner =
    "ELECTION OPEN: NO VOTES RECORDED";

  let winnerColor = "#475569";

  if (
    totalVotes > 0 &&
    election.votes.Kosi >
      election.votes.Augustine
  ) {
    winnerBanner = "🏆 CURRENT LEADER: KOSI";
    winnerColor = "#0f766e";
  }

  if (
    totalVotes > 0 &&
    election.votes.Augustine >
      election.votes.Kosi
  ) {
    winnerBanner =
      "CURRENT LEADER: AUGUSTINE";
    winnerColor = "#0f766e";
  }

  if (
    totalVotes > 0 &&
    election.votes.Kosi ===
      election.votes.Augustine
  ) {
    winnerBanner =
      "CURRENT STATUS: DRAW TIE";
    winnerColor = "#d97706";
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "40px 20px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "35px",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px 0",
          }}
        >
          <h2
            style={{
              color: "green",
              fontSize:
                "clamp(2rem, 5vw, 2.5rem)",
              fontWeight: "600",
              margin: 0,
              textAlign: "center",
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom:
                "4px solid #10b981",
              paddingBottom: "10px",
            }}
          >
            Head Of House E-Portal
          </h2>
        </div>

        {/* LOADING */}

        {isLoading && (
          <div
            style={{
              backgroundColor: "#e0f2fe",
              color: "#075985",
              padding: "15px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Loading election system...
          </div>
        )}

        {/* =========================
            ROW 1
        ========================= */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "30px",
            width: "100%",
          }}
        >
          {/* ACCREDITATION */}

          <div
            style={{
              flex: "1 1 10px",
              backgroundColor: " #007bff;",
              color: " #007bff;",
              padding: "15px",
              borderRadius: "16px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  color: "white",
                  margin:
                    "0 0 5px 0",
                  fontSize: "1rem",
                  fontWeight: "italic",
                  textAlign: "center"
                  
                }}
              >
                GENERATE YOUR VOTING TOKEN HERE
              </h2>

              
              <input
                type="text"
                placeholder="Full Name (Required)"
                value={voterName}
                onChange={(e) =>
                  setVoterName(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  border:
                    "1px solid #475569",
                  backgroundColor:
                    "white",
                  color: "blue",
                  fontSize: "1rem",
                  boxSizing:
                    "border-box",
                  outline: "none",
                }}
              />

              <input
                type="email"
                placeholder="Email Address (Required)"
                value={voterEmail}
                onChange={(e) =>
                  setVoterEmail(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "25px",
                  borderRadius: "8px",
                  border:
                    "1px solid #475569",
                  backgroundColor:
                    "white",
                  color: "blue",
                  fontSize: "1rem",
                  boxSizing:
                    "border-box",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <button
                onClick={() =>
                  isGenerationFormValid &&
                  generateIdMutation.mutate()
                }
                disabled={
                  !isGenerationFormValid ||
                  generateIdMutation.isPending
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor:
                    !isGenerationFormValid ||
                    generateIdMutation.isPending
                      ? "#475569"
                      : "#38bdf8",
                  color:
                    !isGenerationFormValid ||
                    generateIdMutation.isPending
                      ? "#94a3b8"
                      : "#0f172a",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    isGenerationFormValid &&
                    !generateIdMutation.isPending
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "1rem",
                }}
              >
                {generateIdMutation.isPending
                  ? "Generating..."
                  : "Authorize & Generate ID"}
              </button>

              {generatedToken && (
                <div
                  style={{
                    backgroundColor:
                      "#0284c7",
                    border:
                      "1px solid #38bdf8",
                    color: "white",
                    padding: "7px",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    marginTop: "5px",
                    textAlign: "center",
                  }}
                >
                  Copy your ID:

                  <span
                    style={{
                      display:
                        "inline-block",
                      fontFamily:
                        "monospace",
                      fontSize: "1.1rem",
                      backgroundColor:
                        "#0f172a",
                      padding:
                        "4px 8px",
                      borderRadius:
                        "4px",
                      marginLeft: "5px",
                      marginTop: "1px",
                    }}
                  >
                    {generatedToken}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VOTING BOOTH */}

          <div
            style={{
              flex: "1 1 200px",
              backgroundColor: "orange",
              padding: "15px",
              borderRadius: "16px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.05)",
              border:
                "1px solid #e2e8f0",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent:
                "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  color: "white",
                  textAlign: "center",
                  margin:
                    "0 0 10px 0",
                  fontSize: "1.5rem",
                  fontWeight: "normal",
                }}
              >
                VOTE HERE
              </h2>

              
              <input
                type="text"
                placeholder="Paste or Type Your Unique Key"
                value={voterIdInput}
                onChange={(e) => {
                  setVoterIdInput(
                    e.target.value
                  );
                  setSubmissionError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  border:
                    "2px solid " +
                    (hasAlreadyVoted
                      ? "#f59e0b"
                      : isInputCodeValid
                      ? "#10b981"
                      : "#ef4444"),
                  fontSize: "1rem",
                  boxSizing:
                    "border-box",
                  fontWeight: "500",
                  backgroundColor:
                    "#f8fafc",
                  color: "blue",
                  outline: "none",
                }}
              />

              {hasAlreadyVoted && (
                <div
                  style={{
                    color: "#92400e",
                    backgroundColor:
                      "#fffbeb",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "15px",
                    border:
                      "1px solid #fcd34d",
                    fontWeight: "500",
                  }}
                >
                   You alread voted.
                </div>
              )}

              {submissionError && (
                <div
                  style={{
                    color: "#991b1b",
                    backgroundColor:
                      "#fef2f2",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "15px",
                    border:
                      "1px solid #fca5a5",
                    fontWeight: "500",
                  }}
                >
                  ⚠️ {submissionError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() =>
                  isVoteInputValid &&
                  voteMutation.mutate(
                    "Kosi"
                  )
                }
                disabled={
                  !isVoteInputValid ||
                  voteMutation.isPending
                }
                style={{
                  flex:
                    "1 1 180px",
                  backgroundColor:
                    !isVoteInputValid ||
                    voteMutation.isPending
                      ? "#f1f5f9"
                      : "#2563eb",
                  color:
                    !isVoteInputValid ||
                    voteMutation.isPending
                      ? "#94a3b8"
                      : "white",
                  padding: "16px",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  cursor:
                    isVoteInputValid &&
                    !voteMutation.isPending
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {voteMutation.isPending
                  ? "Processing..."
                  : "Vote Kosi"}
              </button>

              <button
                onClick={() =>
                  isVoteInputValid &&
                  voteMutation.mutate(
                    "Augustine"
                  )
                }
                disabled={
                  !isVoteInputValid ||
                  voteMutation.isPending
                }
                style={{
                  flex:
                    "1 1 10px",
                  backgroundColor:
                    !isVoteInputValid ||
                    voteMutation.isPending
                      ? "#f1f5f9"
                      : "#10b981",
                  color:
                    !isVoteInputValid ||
                    voteMutation.isPending
                      ? "#94a3b8"
                      : "white",
                  padding: "16px",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  cursor:
                    isVoteInputValid &&
                    !voteMutation.isPending
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {voteMutation.isPending
                  ? "Processing..."
                  : "Vote Augustine"}
              </button>
            </div>
          </div>
        </div>

        {/* =========================
            ROW 2
        ========================= */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "30px",
            width: "100%",
          }}
        >
          {/* WINNER BANNER */}

          <div
            style={{
              flex: "10px",
              backgroundColor:
                winnerColor,
              color: "white",
              paddingTop: "10px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "1rem",
              boxSizing:
                "border-box",
              minHeight: "10px",
            }}
          >
            {winnerBanner}
          </div>

          {/* AUDIT METRICS */}

          <div
            style={{
              flex: "1 1 480px",
              backgroundColor:
                "#ffffff",
              padding:
                "30px 40px",
              borderRadius:
                "16px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.05)",
              border:
                "1px solid #e2e8f0",
              boxSizing:
                "border-box",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 20px 0",
                color:
                  "#0f172a",
                fontSize:
                  "1.1rem",
                borderBottom:
                  "1px solid #f1f5f9",
                paddingBottom:
                  "10px",
              }}
            >
              Vote Summary
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(10px, 1fr))",
                gap: "15px",
              }}
            >
              {/* ACCREDITED */}

              <div
                style={{
                  backgroundColor:
                    "white",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "10px",
                  padding:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "0.8rem",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  ACCREDITED
                </div>

                <div
                  style={{
                    color:
                      "#0f172a",
                    fontSize:
                      "1.7rem",
                    fontWeight:
                      "800",
                  }}
                >
                  {totalAccredited}
                </div>
              </div>

              {/* TOTAL VOTES */}

              <div
                style={{
                  backgroundColor:
                    "#eff6ff",
                  border:
                    "1px solid #bfdbfe",
                  borderRadius:
                    "10px",
                  padding:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#1d4ed8",
                    fontSize:
                      "0.8rem",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  TOTAL VOTES
                </div>

                <div
                  style={{
                    color:
                      "#1e3a8a",
                    fontSize:
                      "1.7rem",
                    fontWeight:
                      "800",
                  }}
                >
                  {totalVotes}
                </div>
              </div>

              {/* TURNOUT */}

              <div
                style={{
                  backgroundColor:
                    "#ecfdf5",
                  border:
                    "1px solid #a7f3d0",
                  borderRadius:
                    "10px",
                  padding:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#047857",
                    fontSize:
                      "0.8rem",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  TURNOUT
                </div>

                <div
                  style={{
                    color:
                      "#065f46",
                    fontSize:
                      "1.7rem",
                    fontWeight:
                      "800",
                  }}
                >
                  {turnoutPercentage}%
                </div>
              </div>

              {/* UNUSED IDS */}

              <div
                style={{
                  backgroundColor:
                    "#fff7ed",
                  border:
                    "1px solid #fed7aa",
                  borderRadius:
                    "10px",
                  padding:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#c2410c",
                    fontSize:
                      "0.8rem",
                    fontWeight:
                      "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  UNUSED IDS
                </div>

                <div
                  style={{
                    color:
                      "#9a3412",
                    fontSize:
                      "1.7rem",
                    fontWeight:
                      "800",
                  }}
                >
                  {totalUnusedIds}
                </div>
              </div>
            </div>

            {/* CANDIDATE BREAKDOWN */}

            <div
              style={{
                marginTop:
                  "20px",
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  backgroundColor:
                    "#eff6ff",
                  padding:
                    "12px 15px",
                  borderRadius:
                    "8px",
                }}
              >
                <span
                  style={{
                    fontWeight:
                      "bold",
                    color:
                      "#1e40af",
                  }}
                >
                  🔵 Kosi
                </span>

                <strong
                  style={{
                    color:
                      "#1e3a8a",
                  }}
                >
                  {election.votes.Kosi}{" "}
                  votes
                </strong>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  backgroundColor:
                    "#ecfdf5",
                  padding:
                    "12px 15px",
                  borderRadius:
                    "8px",
                }}
              >
                <span
                  style={{
                    fontWeight:
                      "bold",
                    color:
                      "#047857",
                  }}
                >
                  🟢 Augustine
                </span>

                <strong
                  style={{
                    color:
                      "#065f46",
                  }}
                >
                  {
                    election.votes
                      .Augustine
                  }{" "}
                  votes
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div
          style={{
            textAlign:
              "center",
            color:
              "#64748b",
            fontSize:
              "0.8rem",
            padding: "5px",
          }}
        >
          Head Of House Electronic
          Voting Portal •{" "}
          {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}