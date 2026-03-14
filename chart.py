import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime

# Project phases and timelines
tasks = [
    ("Requirement Analysis", "2025-12-01", "2025-12-20"),
    ("UI & Frontend Development", "2025-12-15", "2026-01-31"),
    ("Backend Development", "2026-01-01", "2026-02-20"),
    ("Database Design", "2026-01-10", "2026-02-28"),
    ("Integration & Core Modules", "2026-02-10", "2026-03-10"),
    ("Testing & Debugging", "2026-03-10", "2026-03-30"),
    ("Deployment & Final Review", "2026-04-01", "2026-04-20")
]

fig, ax = plt.subplots(figsize=(12,6))

for i, (task, start, end) in enumerate(tasks):
    start_date = datetime.strptime(start, "%Y-%m-%d")
    end_date = datetime.strptime(end, "%Y-%m-%d")
    
    ax.barh(task, end_date - start_date, left=start_date)

# Formatting timeline
ax.xaxis.set_major_locator(mdates.MonthLocator())
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))

plt.title("Project Timeline – NexClaim Vehicle Insurance Claim Processing Platform", fontsize=14)
plt.xlabel("Project Timeline (Dec 2025 – Apr 2026)")
plt.ylabel("Project Phases")

plt.tight_layout()
plt.grid(axis='x', linestyle='--', alpha=0.5)

plt.savefig("nexclaim_timeline_chart.png", dpi=300)
plt.show()