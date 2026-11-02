(function () {
    "use strict";

    // Duplicate loading protection
    if (window.__CRICKET_MANAGER_STARTED__) return;
    window.__CRICKET_MANAGER_STARTED__ = true;

    const BID_INCREMENT = 100;

    let data;

    try {
        data = JSON.parse(localStorage.getItem("cricketManagerData"));
    } catch (error) {
        data = null;
    }

    if (!data || !Array.isArray(data.teams) ||
        !Array.isArray(data.players) ||
        !Array.isArray(data.matches)) {
        data = { teams: [], players: [], matches: [] };
    }

    let selectedAuctionPlayer = "";
    let selectedScoreMatch = "";

    function id() {
        return Date.now().toString() + Math.floor(Math.random() * 9999);
    }

    function money(amount) {
        return "Rs. " + Number(amount).toLocaleString("en-PK");
    }

    function safe(value) {
        return String(value).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function team(id) {
        return data.teams.find(t => t.id === id);
    }

    function player(id) {
        return data.players.find(p => p.id === id);
    }

    function teamName(id) {
        return team(id)?.name || "Unknown Team";
    }

    function save() {
        localStorage.setItem("cricketManagerData", JSON.stringify(data));
        renderAll();
    }

    // NAVIGATION

    window.showPage = function (pageId) {
        document.querySelectorAll(".page").forEach(p => {
            p.classList.remove("active");
        });

        document.getElementById(pageId).classList.add("active");
        renderAll();
    };

    // TEAMS

    window.addTeam = function () {
        const name = document.getElementById("teamName").value.trim();
        const captain = document.getElementById("captainName").value.trim();
        const budget = Number(document.getElementById("teamBudget").value);

        if (!name || !captain || !Number.isFinite(budget) || budget <= 0) {
            alert("Team details aur valid budget enter karo.");
            return;
        }

        data.teams.push({
            id: id(),
            name,
            captain,
            budget,
            spent: 0,
            squad: []
        });

        document.getElementById("teamName").value = "";
        document.getElementById("captainName").value = "";
        document.getElementById("teamBudget").value = "";

        save();
    };

    window.deleteTeam = function (teamId) {
        const t = team(teamId);
        if (!t) return;

        if (!confirm("Team delete karne se uske sold players auction mein wapas aa jayenge. Continue?")) return;

        data.players.forEach(p => {
            if (p.soldTeam === teamId) {
                p.status = "Pending";
                p.currentBid = p.base;
                p.bidTeam = null;
                p.soldTeam = null;
                p.soldPrice = 0;
            } else if (p.bidTeam === teamId) {
                p.bidTeam = null;
                p.currentBid = p.base;
            }
        });

        data.matches = data.matches.filter(m =>
            m.a !== teamId && m.b !== teamId
        );

        data.teams = data.teams.filter(t => t.id !== teamId);
        selectedScoreMatch = "";
        save();
    };

    function renderTeams() {
        document.getElementById("teamList").innerHTML =
            data.teams.map(t => `
                <div class="card">
                    <h3>${safe(t.name)}</h3>
                    <p>Captain: ${safe(t.captain)}</p>
                    <p>Players: ${t.squad.length}</p>
                    <p>Budget: ${money(t.budget)}</p>
                    <p>Spent: ${money(t.spent)}</p>
                    <p>Remaining: ${money(t.budget - t.spent)}</p>
                    <button class="delete-button" onclick="deleteTeam('${t.id}')">Delete Team</button>
                </div>
            `).join("") || "<p>No teams added.</p>";

        const opts = data.teams.map(t =>
            `<option value="${t.id}">${safe(t.name)}</option>`
        ).join("");

        document.getElementById("matchTeamA").innerHTML =
            `<option value="">Select Team A</option>${opts}`;

        document.getElementById("matchTeamB").innerHTML =
            `<option value="">Select Team B</option>${opts}`;
    }

    // PLAYERS

    window.addAuctionPlayer = function () {
        const name = document.getElementById("playerName").value.trim();
        const role = document.getElementById("playerRole").value;
        const base = Number(document.getElementById("basePrice").value);

        if (!name || !Number.isFinite(base) || base <= 0) {
            alert("Player name aur valid base price enter karo.");
            return;
        }

        data.players.push({
            id: id(),
            name,
            role,
            base,
            currentBid: base,
            status: "Pending",
            bidTeam: null,
            soldTeam: null,
            soldPrice: 0
        });

        document.getElementById("playerName").value = "";
        document.getElementById("basePrice").value = "";
        save();
    };

    window.deletePlayer = function (playerId) {
        const p = player(playerId);
        if (!p) return;

        if (!confirm("Is player ko delete karna hai?")) return;

        if (p.status === "Sold" && p.soldTeam) {
            const t = team(p.soldTeam);

            if (t) {
                t.spent -= p.soldPrice;
                t.squad = t.squad.filter(s => s.playerId !== p.id);
            }
        }

        data.players = data.players.filter(p => p.id !== playerId);

        if (selectedAuctionPlayer === playerId) {
            selectedAuctionPlayer = "";
        }

        save();
    };

    function renderPlayers() {
        document.getElementById("playerList").innerHTML =
            data.players.map(p => `
                <div class="card">
                    <h3>${safe(p.name)}</h3>
                    <p>Role: ${safe(p.role)}</p>
                    <p>Base Price: ${money(p.base)}</p>
                    <p>Status: ${p.status}</p>
                    <p>Team: ${p.soldTeam ? safe(teamName(p.soldTeam)) : "-"}</p>
                    <button class="delete-button" onclick="deletePlayer('${p.id}')">Delete Player</button>
                </div>
            `).join("") || "<p>No players added.</p>";
    }

    // AUCTION

    function fillAuction() {
        const select = document.getElementById("auctionPlayer");
        const available = data.players.filter(p =>
            p.status === "Pending" || p.status === "Active"
        );

        select.innerHTML =
            `<option value="">Select Player</option>` +
            available.map(p =>
                `<option value="${p.id}">${safe(p.name)} (${p.status})</option>`
            ).join("");

        if (available.some(p => p.id === selectedAuctionPlayer)) {
            select.value = selectedAuctionPlayer;
        } else {
            selectedAuctionPlayer = "";
        }
    }

    window.loadAuctionPlayer = function () {
        selectedAuctionPlayer = document.getElementById("auctionPlayer").value;

        const p = player(selectedAuctionPlayer);
        if (!p) {
            renderAuction();
            return;
        }

        if (p.status === "Pending") {
            p.status = "Active";
            p.currentBid = p.base;
            p.bidTeam = null;
        }

        save();
    };

    window.placeBid = function (teamId) {
        const p = player(selectedAuctionPlayer);
        const t = team(teamId);

        if (!p || !t || p.status !== "Active") return;

        if (p.bidTeam === teamId) {
            alert("Doosri team ki bid ka wait karo.");
            return;
        }

        // First bid = base price.
        // Every next bid = previous bid + Rs. 100.
        const next = p.bidTeam === null
            ? p.base
            : p.currentBid + BID_INCREMENT;

        const remaining = t.budget - t.spent;

        if (remaining < next) {
            alert("Budget kam hai. Required: " + money(next) +
                " | Remaining: " + money(remaining));
            return;
        }

        p.currentBid = next;
        p.bidTeam = teamId;
        save();
    };

    window.sellPlayer = function () {
        const p = player(selectedAuctionPlayer);

        if (!p || p.status !== "Active") return;

        if (!p.bidTeam) {
            alert("Pehle kisi team ki bid lagao.");
            return;
        }

        const t = team(p.bidTeam);

        if (!t || t.budget - t.spent < p.currentBid) {
            alert("Team ka budget insufficient hai.");
            return;
        }

        t.spent += p.currentBid;

        t.squad.push({
            playerId: p.id,
            name: p.name,
            role: p.role,
            price: p.currentBid
        });

        p.status = "Sold";
        p.soldTeam = t.id;
        p.soldPrice = p.currentBid;

        selectedAuctionPlayer = "";
        save();
    };

    window.unsoldPlayer = function () {
        const p = player(selectedAuctionPlayer);
        if (!p || p.status !== "Active") return;

        p.status = "Unsold";
        p.bidTeam = null;
        p.currentBid = p.base;

        selectedAuctionPlayer = "";
        save();
    };

    function renderAuction() {
        const area = document.getElementById("auctionDisplay");
        const p = player(selectedAuctionPlayer);

        if (!p) {
            area.innerHTML = "<p>Select a player to start auction.</p>";
            return;
        }

        if (p.status !== "Active") {
            area.innerHTML = `<h3>Player ${p.status}</h3>`;
            return;
        }

        const next = p.bidTeam === null
            ? p.base
            : p.currentBid + BID_INCREMENT;

        const buttons = data.teams.map(t => {
            const highest = p.bidTeam === t.id;
            const cannotAfford = t.budget - t.spent < next;

            return `
                <button class="bid-button"
                    onclick="placeBid('${t.id}')"
                    ${highest || cannotAfford ? "disabled" : ""}>
                    ${safe(t.name)}
                    ${highest ? "(Highest)" : "Bid " + money(next)}
                </button>
            `;
        }).join("");

        area.innerHTML = `
            <div class="auction-box">
                <h3>${safe(p.name)}</h3>
                <p>Role: ${safe(p.role)}</p>
                <p>Base Price: ${money(p.base)}</p>
                <h2 class="bid-price">${money(p.currentBid)}</h2>
                <p>Highest Bidder: ${p.bidTeam ? safe(teamName(p.bidTeam)) : "No bid yet"}</p>
                <p>Next Bid: ${money(next)}</p>
                <div class="score-buttons">
                    ${buttons || "<p>Add teams first.</p>"}
                </div>
                <button class="sold-button" onclick="sellPlayer()">SOLD</button>
                <button class="unsold-button" onclick="unsoldPlayer()">UNSOLD</button>
            </div>
        `;
    }

    function renderBudgets() {
        document.getElementById("auctionTeams").innerHTML =
            data.teams.map(t => `
                <div class="card">
                    <h3>${safe(t.name)}</h3>
                    <p>Budget: ${money(t.budget)}</p>
                    <p>Spent: ${money(t.spent)}</p>
                    <p>Remaining: ${money(t.budget - t.spent)}</p>
                    <p>Players: ${t.squad.length}</p>
                </div>
            `).join("") || "<p>No teams added.</p>";
    }

    function renderHistory() {
        const finished = data.players.filter(p =>
            p.status === "Sold" || p.status === "Unsold"
        );

        document.getElementById("auctionHistory").innerHTML =
            finished.length ? `
                <div class="table-wrap">
                    <table>
                        <tr><th>Player</th><th>Status</th><th>Team</th><th>Price</th></tr>
                        ${finished.map(p => `
                            <tr>
                                <td>${safe(p.name)}</td>
                                <td>${p.status}</td>
                                <td>${p.soldTeam ? safe(teamName(p.soldTeam)) : "-"}</td>
                                <td>${p.status === "Sold" ? money(p.soldPrice) : "-"}</td>
                            </tr>
                        `).join("")}
                    </table>
                </div>
            ` : "<p>No auction history.</p>";
    }

    // MATCHES

    window.createMatch = function () {
        const a = document.getElementById("matchTeamA").value;
        const b = document.getElementById("matchTeamB").value;
        const format = document.getElementById("matchFormat").value;
        const date = document.getElementById("matchDate").value;
        const venue = document.getElementById("matchVenue").value.trim();

        if (!a || !b || a === b) {
            alert("Do different teams select karo.");
            return;
        }

        if (!date || !venue) {
            alert("Date aur venue enter karo.");
            return;
        }

        data.matches.push({
            id: id(), a, b, format, date, venue,
            runs: 0, wickets: 0, balls: 0,
            status: "Upcoming", winner: null
        });

        document.getElementById("matchVenue").value = "";
        save();
    };

    function renderMatches() {
        document.getElementById("matchList").innerHTML =
            data.matches.map(m => `
                <div class="card">
                    <h3>${safe(teamName(m.a))} vs ${safe(teamName(m.b))}</h3>
                    <p>Format: ${m.format}</p>
                    <p>Date: ${m.date}</p>
                    <p>Venue: ${safe(m.venue)}</p>
                    <p>Status: ${m.status}</p>
                    ${m.winner ? `<p>Winner: ${safe(teamName(m.winner))}</p>` : ""}
                </div>
            `).join("") || "<p>No matches created.</p>";

        const select = document.getElementById("scoreMatch");
        const available = data.matches.filter(m => m.status !== "Completed");

        select.innerHTML =
            `<option value="">Select Match</option>` +
            available.map(m => `
                <option value="${m.id}">${safe(teamName(m.a))} vs ${safe(teamName(m.b))}</option>
            `).join("");

        if (available.some(m => m.id === selectedScoreMatch)) {
            select.value = selectedScoreMatch;
        } else {
            selectedScoreMatch = "";
        }
    }

    // SCORING

    window.loadScoreMatch = function () {
        selectedScoreMatch = document.getElementById("scoreMatch").value;
        renderScore();
    };

    function renderScore() {
        const m = data.matches.find(m => m.id === selectedScoreMatch);
        const area = document.getElementById("scoreArea");

        if (!m) {
            area.innerHTML = "<p>Select a match.</p>";
            return;
        }

        area.innerHTML = `
            <h3>${safe(teamName(m.a))} vs ${safe(teamName(m.b))}</h3>
            <div class="score-number">${m.runs}/${m.wickets}</div>
            <h3>Overs: ${Math.floor(m.balls / 6)}.${m.balls % 6}</h3>
            <div class="score-buttons">
                <button onclick="addRuns(0)">0</button>
                <button onclick="addRuns(1)">1</button>
                <button onclick="addRuns(2)">2</button>
                <button onclick="addRuns(3)">3</button>
                <button onclick="addRuns(4)">4</button>
                <button onclick="addRuns(6)">6</button>
                <button class="danger" onclick="addWicket()">WICKET</button>
            </div>
            <select id="matchWinner">
                <option value="">Select Winner</option>
                <option value="${m.a}">${safe(teamName(m.a))}</option>
                <option value="${m.b}">${safe(teamName(m.b))}</option>
            </select>
            <button class="primary" onclick="completeMatch()">Complete Match</button>
        `;
    }

    window.addRuns = function (runs) {
        const m = data.matches.find(m => m.id === selectedScoreMatch);
        if (!m || m.status === "Completed") return;
        m.runs += runs;
        m.balls++;
        save();
    };

    window.addWicket = function () {
        const m = data.matches.find(m => m.id === selectedScoreMatch);
        if (!m || m.status === "Completed") return;
        if (m.wickets >= 10) return alert("10 wickets complete.");
        m.wickets++;
        m.balls++;
        save();
    };

    window.completeMatch = function () {
        const m = data.matches.find(m => m.id === selectedScoreMatch);
        const winner = document.getElementById("matchWinner").value;

        if (!m || !winner) return alert("Winner select karo.");

        m.winner = winner;
        m.status = "Completed";
        selectedScoreMatch = "";
        save();
    };

    // POINTS TABLE

    function renderPoints() {
        document.getElementById("pointsBody").innerHTML =
            data.teams.map(t => {
                const played = data.matches.filter(m =>
                    m.status === "Completed" && (m.a === t.id || m.b === t.id)
                );

                const won = played.filter(m => m.winner === t.id).length;
                const lost = played.length - won;

                return `
                    <tr>
                        <td>${safe(t.name)}</td>
                        <td>${played.length}</td>
                        <td>${won}</td>
                        <td>${lost}</td>
                        <td>${won * 2}</td>
                    </tr>
                `;
            }).join("");
    }

    // DASHBOARD

    function renderDashboard() {
        document.getElementById("teamCount").textContent = data.teams.length;
        document.getElementById("playerCount").textContent = data.players.length;
        document.getElementById("matchCount").textContent = data.matches.length;
        document.getElementById("soldCount").textContent =
            data.players.filter(p => p.status === "Sold").length;
    }

    function renderAll() {
        renderDashboard();
        renderTeams();
        fillAuction();
        renderPlayers();
        renderAuction();
        renderBudgets();
        renderHistory();
        renderMatches();
        renderScore();
        renderPoints();
    }

    renderAll();

})();