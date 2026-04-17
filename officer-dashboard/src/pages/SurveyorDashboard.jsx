import React, { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { claimService, policyService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const STATUS_LABELS = {
	SURVEY_ASSIGNED: 'Survey Assigned',
	SURVEY_COMPLETED: 'Survey Completed'
}

const KNOWN_ACRONYMS = new Set(['idv', 'rc', 'fir', 'pan', 'ai'])

const toReadableLabel = (value) => {
	if (!value) return 'N/A'

	return String(value)
		.replace(/[_-]+/g, ' ')
		.trim()
		.split(/\s+/)
		.map((segment) => {
			const lower = segment.toLowerCase()
			if (KNOWN_ACRONYMS.has(lower)) return lower.toUpperCase()
			return lower.charAt(0).toUpperCase() + lower.slice(1)
		})
		.join(' ')
}

const getStatusLabel = (status) => STATUS_LABELS[status] || toReadableLabel(status)

function SurveyorDashboard({ onSwitchRole }) {
	const dashboardRef = useRef(null)
	const queueViewRef = useRef(null)
	const inspectViewRef = useRef(null)
	const ambientOrbRefs = useRef([])

	const [view, setView] = useState('queue')
	const [surveyClaims, setSurveyClaims] = useState([])
	const [selectedClaim, setSelectedClaim] = useState(null)
	const [selectedPolicy, setSelectedPolicy] = useState(null)
	const [surveyReports, setSurveyReports] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [successMessage, setSuccessMessage] = useState(null)

	const [surveyForm, setSurveyForm] = useState({
		surveyor_id: 'SURVEYOR001',
		surveyor_name: 'Field Surveyor',
		damage_description: '',
		vehicle_condition: '',
		parts_damaged: '',
		estimated_repair_cost: '',
		recommendation: 'Repair'
	})

	useEffect(() => {
		loadSurveyClaims()
	}, [])

	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.fromTo(
				dashboardRef.current,
				{ autoAlpha: 0, y: 26, filter: 'blur(10px)' },
				{ autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: 0.1 }
			)

			const orbs = ambientOrbRefs.current.filter(Boolean)
			if (!orbs.length) return

			gsap.fromTo(
				orbs,
				{ autoAlpha: 0, scale: 0.88 },
				{ autoAlpha: 0.95, scale: 1, duration: 1.2, stagger: 0.16, ease: 'power3.out', delay: 0.2 }
			)

			orbs.forEach((orb, index) => {
				gsap.to(orb, {
					x: index === 1 ? -18 : 14,
					y: index === 2 ? 20 : -16,
					duration: 4 + index,
					repeat: -1,
					yoyo: true,
					ease: 'sine.inOut'
				})
			})
		}, dashboardRef)

		return () => ctx.revert()
	}, [])

	useEffect(() => {
		const target = view === 'queue' ? queueViewRef.current : inspectViewRef.current
		if (!target) return

		const ctx = gsap.context(() => {
			const cards = target.querySelectorAll('.sd-anim-item')

			gsap.fromTo(target, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' })

			if (!cards.length) return

			gsap.fromTo(
				cards,
				{ autoAlpha: 0, y: 20 },
				{ autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power2.out', delay: 0.08 }
			)
		}, target)

		return () => ctx.revert()
	}, [view, surveyClaims.length, selectedClaim?.id, surveyReports.length])

	const latestSurveyReport = useMemo(() => {
		return surveyReports[0] || selectedClaim?.latest_survey_report || null
	}, [selectedClaim, surveyReports])

	const pendingAssignment = useMemo(() => {
		return surveyReports.find((report) => !report.submitted_at) || latestSurveyReport
	}, [latestSurveyReport, surveyReports])

	const queueStats = useMemo(() => {
		const overdueCount = surveyClaims.filter((claim) => {
			const assignedAt = claim.latest_survey_report?.assigned_at
			if (!assignedAt) return false
			return Date.now() - new Date(assignedAt).getTime() > 48 * 60 * 60 * 1000
		}).length

		const highValueCount = surveyClaims.filter((claim) => {
			const estimate = claim.latest_survey_report?.estimated_repair_cost || 0
			return estimate >= 100000
		}).length

		return {
			assigned: surveyClaims.length,
			overdue: overdueCount,
			highValue: highValueCount
		}
	}, [surveyClaims])

	const formatCurrency = (value) => {
		if (value === null || value === undefined || value === '') return 'N/A'
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(Number(value))
	}

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		})
	}

	const formatDateTime = (dateString) => {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const getStatusBadge = (status) => {
		const colors = {
			SURVEY_ASSIGNED: {
				backgroundColor: 'rgba(255, 190, 92, 0.16)',
				color: '#ffcb86',
				border: '1px solid rgba(255, 190, 92, 0.35)'
			},
			SURVEY_COMPLETED: {
				backgroundColor: 'rgba(104, 235, 175, 0.16)',
				color: '#8ff0bf',
				border: '1px solid rgba(104, 235, 175, 0.34)'
			}
		}

		return (
			colors[status] || {
				backgroundColor: 'rgba(156, 163, 175, 0.16)',
				color: '#e3e8f0',
				border: '1px solid rgba(156, 163, 175, 0.3)'
			}
		)
	}

	const getRecommendationTone = (recommendation) => {
		switch (recommendation) {
			case 'Total Loss':
				return {
					backgroundColor: 'rgba(255, 102, 102, 0.16)',
					color: '#ffb8b8',
					border: '1px solid rgba(255, 102, 102, 0.34)'
				}
			case 'Further Investigation':
				return {
					backgroundColor: 'rgba(255, 179, 71, 0.16)',
					color: '#ffd59a',
					border: '1px solid rgba(255, 179, 71, 0.34)'
				}
			case 'Reject':
				return {
					backgroundColor: 'rgba(255, 92, 153, 0.16)',
					color: '#ffc3d9',
					border: '1px solid rgba(255, 92, 153, 0.34)'
				}
			case 'Partial Claim':
				return {
					backgroundColor: 'rgba(125, 170, 255, 0.16)',
					color: '#c6dbff',
					border: '1px solid rgba(125, 170, 255, 0.34)'
				}
			default:
				return {
					backgroundColor: 'rgba(104, 235, 175, 0.16)',
					color: '#8ff0bf',
					border: '1px solid rgba(104, 235, 175, 0.34)'
				}
		}
	}

	const loadSurveyClaims = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await claimService.getSurveyClaims()
			setSurveyClaims(Array.isArray(response.data) ? response.data : [])
		} catch (err) {
			console.error('Error loading survey claims:', err)
			setError('Failed to load survey assignments')
			setSurveyClaims([])
		} finally {
			setLoading(false)
		}
	}

	const hydrateClaimContext = async (claimId, claimData = null) => {
		const claimResponse = claimData ? { data: claimData } : await claimService.getClaim(claimId)
		const reportsResponse = await claimService.getSurveyReports(claimId)

		setSelectedClaim(claimResponse.data)
		setSurveyReports(Array.isArray(reportsResponse.data) ? reportsResponse.data : [])

		if (claimResponse.data.policy_id) {
			const raw = claimResponse.data.policy_id
			const pid = Number(raw)
			if (Number.isInteger(pid)) {
				try {
					const policyResponse = await policyService.getPolicy(pid)
					setSelectedPolicy(policyResponse.data)
				} catch (e) {
					console.error('Failed to fetch policy by id', pid, e)
					setSelectedPolicy(null)
				}
			} else if (typeof raw === 'string' && raw.trim()) {
				try {
					const policyResponse = await policyService.getPolicyByNumber(raw)
					setSelectedPolicy(policyResponse.data)
				} catch (e) {
					console.error('Failed to fetch policy by policy_number fallback', raw, e)
					setSelectedPolicy(null)
				}
			} else {
				console.warn('Claim has invalid policy_id value:', raw)
				setSelectedPolicy(null)
			}
		} else {
			setSelectedPolicy(null)
		}

		const activeReport =
			(reportsResponse.data || []).find((report) => !report.submitted_at) ||
			claimResponse.data.latest_survey_report

		setSurveyForm((prev) => ({
			...prev,
			surveyor_id: activeReport?.surveyor_id || 'SURVEYOR001',
			surveyor_name: activeReport?.surveyor_name || 'Field Surveyor',
			damage_description: '',
			vehicle_condition: '',
			parts_damaged: '',
			estimated_repair_cost: '',
			recommendation: 'Repair'
		}))
	}

	const handleInspectClaim = async (claim) => {
		setLoading(true)
		setError(null)
		setSuccessMessage(null)

		try {
			await hydrateClaimContext(claim.id)
			setView('inspect')
		} catch (err) {
			console.error('Error loading claim details:', err)
			setError('Failed to load claim details')
		} finally {
			setLoading(false)
		}
	}

	const handleFormChange = (e) => {
		const { name, value } = e.target
		setSurveyForm((prev) => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmitSurvey = async (e) => {
		e.preventDefault()
		if (!selectedClaim) return

		setLoading(true)
		setError(null)
		setSuccessMessage(null)

		try {
			const payload = {
				surveyor_id: surveyForm.surveyor_id,
				surveyor_name: pendingAssignment?.surveyor_name || surveyForm.surveyor_name,
				damage_description: surveyForm.damage_description,
				vehicle_condition: surveyForm.vehicle_condition,
				parts_damaged: surveyForm.parts_damaged,
				estimated_repair_cost: parseFloat(surveyForm.estimated_repair_cost) || 0,
				recommendation: surveyForm.recommendation
			}

			await claimService.submitSurveyReport(selectedClaim.id, payload)
			await hydrateClaimContext(selectedClaim.id)
			setSuccessMessage('Survey report submitted successfully and shared with the officer console.')

			setTimeout(() => {
				setSelectedClaim(null)
				setSelectedPolicy(null)
				setSurveyReports([])
				setView('queue')
				loadSurveyClaims()
			}, 1600)
		} catch (err) {
			const message = err.response?.data?.detail || err.message || 'Failed to submit survey report'
			setError(message)
		} finally {
			setLoading(false)
		}
	}

	const handleBackToQueue = () => {
		setSelectedClaim(null)
		setSelectedPolicy(null)
		setSurveyReports([])
		setView('queue')
		setError(null)
		setSuccessMessage(null)
	}

	const surfaceCard = {
		background: 'linear-gradient(170deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
		border: '1px solid rgba(255,255,255,0.12)',
		boxShadow: '0 26px 56px rgba(0,0,0,0.35)',
		borderRadius: '22px'
	}

	const infoLabel = {
		fontSize: '11px',
		letterSpacing: '0.08em',
		color: 'rgba(220,228,240,0.7)',
		fontWeight: 600
	}

	const inputStyle = {
		width: '100%',
		boxSizing: 'border-box',
		padding: '12px 14px',
		borderRadius: '12px',
		border: '1px solid rgba(255,255,255,0.16)',
		background: 'rgba(15,20,32,0.74)',
		color: '#f5f8ff',
		fontSize: '14px',
		outline: 'none'
	}

	const renderQueue = () => (
		<section>
			<div
				className="sd-anim-item"
				style={{
					...surfaceCard,
					padding: '24px',
					marginBottom: '18px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '16px',
					flexWrap: 'wrap'
				}}
			>
				<div>
					<div style={{ color: 'rgba(222,230,242,0.7)', fontSize: '12px', letterSpacing: '0.08em', marginBottom: '8px' }}>
						Survey Operations Queue
					</div>
					<h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 32px)', color: '#f4f7ff', fontWeight: 560 }}>Field Assignments</h2>
					<p style={{ margin: '8px 0 0', color: 'rgba(211,223,242,0.78)', maxWidth: '700px' }}>
						Real-time assignment visibility for pending vehicle inspections, with timing context and status progression.
					</p>
				</div>

				<button
					onClick={loadSurveyClaims}
					disabled={loading}
					style={{
						padding: '12px 24px',
						cursor: loading ? 'not-allowed' : 'pointer',
						opacity: loading ? 0.66 : 1,
						background: 'linear-gradient(145deg, #f7f8fb, #dce7f9)',
						color: '#10131a',
						border: '1px solid rgba(255,255,255,0.6)',
						borderRadius: '999px',
						fontWeight: 650,
						fontSize: '13px',
						boxShadow: '0 16px 30px rgba(0,0,0,0.35)'
					}}
				>
					{loading ? 'Refreshing...' : 'Refresh Queue'}
				</button>
			</div>

			<div
				className="sd-anim-item"
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
					gap: '14px',
					marginBottom: '18px'
				}}
			>
				{[
					{ label: 'Assigned', value: queueStats.assigned, accent: '#bfd3ff' },
					{ label: 'Overdue', value: queueStats.overdue, accent: '#ffce8f' },
					{ label: 'High Value', value: queueStats.highValue, accent: '#9eebc1' }
				].map((card) => (
					<div
						key={card.label}
						style={{
							...surfaceCard,
							padding: '16px 18px',
							background: 'linear-gradient(150deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
						}}
					>
						<div style={{ ...infoLabel, marginBottom: '8px' }}>{card.label}</div>
						<div style={{ fontSize: '30px', fontWeight: 650, color: card.accent }}>{card.value}</div>
					</div>
				))}
			</div>

			{error && (
				<div
					className="sd-anim-item"
					style={{
						color: '#ffc1c1',
						padding: '14px 16px',
						marginBottom: '18px',
						backgroundColor: 'rgba(255, 82, 82, 0.12)',
						borderRadius: '14px',
						border: '1px solid rgba(255, 102, 102, 0.36)'
					}}
				>
					<strong>Error:</strong> {error}
				</div>
			)}

			{surveyClaims.length === 0 ? (
				<div
					className="sd-anim-item"
					style={{
						...surfaceCard,
						padding: '46px 24px',
						textAlign: 'center',
						borderStyle: 'dashed',
						color: 'rgba(211,223,242,0.78)'
					}}
				>
					No claims are currently assigned for survey.
				</div>
			) : (
				<div className="sd-anim-item" style={{ ...surfaceCard, overflow: 'hidden' }}>
					<div style={{ overflowX: 'auto' }}>
						<table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '840px' }}>
							<thead>
								<tr style={{ background: 'linear-gradient(100deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))' }}>
									{['Claim', 'Policy / Vehicle', 'Assigned', 'Surveyor', 'Status', 'Action'].map((heading) => (
										<th
											key={heading}
											style={{
												padding: '16px',
												textAlign: heading === 'Action' ? 'center' : 'left',
												fontWeight: 560,
												color: 'rgba(241,246,255,0.92)',
												fontSize: '13px',
												letterSpacing: '0.03em',
												borderBottom: '1px solid rgba(255,255,255,0.1)'
											}}
										>
											{heading}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{surveyClaims.map((claim) => {
									const assignment = claim.latest_survey_report
									return (
										<tr key={claim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
											<td style={{ padding: '16px' }}>
												<div style={{ fontWeight: 650, color: '#f2f6ff' }}>{claim.claim_number}</div>
												<div style={{ fontSize: '12px', color: 'rgba(206,219,238,0.72)', marginTop: '5px' }}>
													Incident: {formatDate(claim.incident_date)}
												</div>
											</td>
											<td style={{ padding: '16px' }}>
												<div style={{ color: '#edf2ff', fontWeight: 560 }}>Policy ID #{claim.policy_id}</div>
												<div style={{ fontSize: '12px', color: 'rgba(206,219,238,0.72)', marginTop: '5px' }}>
													{assignment?.vehicle_condition || 'Awaiting field inspection'}
												</div>
											</td>
											<td style={{ padding: '16px' }}>
												<div style={{ color: '#edf2ff', fontWeight: 560 }}>{formatDateTime(assignment?.assigned_at)}</div>
												<div style={{ fontSize: '12px', color: 'rgba(206,219,238,0.72)', marginTop: '5px' }}>
													{assignment?.assignment_notes || 'Standard inspection assignment'}
												</div>
											</td>
											<td style={{ padding: '16px' }}>
												<div style={{ color: '#edf2ff', fontWeight: 560 }}>{assignment?.surveyor_name || 'Field Surveyor'}</div>
												<div style={{ fontSize: '12px', color: 'rgba(206,219,238,0.72)', marginTop: '5px' }}>
													{assignment?.surveyor_id || 'SURVEYOR001'}
												</div>
											</td>
											<td style={{ padding: '16px' }}>
												<span
													style={{
														padding: '6px 12px',
														borderRadius: '999px',
														...getStatusBadge(claim.status),
														fontSize: '12px',
														fontWeight: 650
													}}
												>
													{getStatusLabel(claim.status)}
												</span>
											</td>
											<td style={{ padding: '16px', textAlign: 'center' }}>
												<button
													onClick={() => handleInspectClaim(claim)}
													disabled={loading}
													style={{
														padding: '9px 18px',
														cursor: loading ? 'not-allowed' : 'pointer',
														opacity: loading ? 0.66 : 1,
														background: 'linear-gradient(145deg, #f6f8ff, #dce7f9)',
														color: '#11151e',
														border: '1px solid rgba(255,255,255,0.6)',
														borderRadius: '999px',
														fontSize: '13px',
														fontWeight: 650
													}}
												>
													Inspect
												</button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</section>
	)

	const renderInspectionPanel = () => (
		<section style={{ marginBottom: '18px' }}>
			<div
				className="sd-anim-item"
				style={{
					...surfaceCard,
					padding: '24px',
					marginBottom: '18px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '18px',
					flexWrap: 'wrap'
				}}
			>
				<div>
					<button
						onClick={handleBackToQueue}
						style={{
							padding: '8px 16px',
							backgroundColor: 'rgba(255,255,255,0.06)',
							color: '#d8e4f8',
							border: '1px solid rgba(255,255,255,0.2)',
							borderRadius: '999px',
							cursor: 'pointer',
							marginBottom: '14px',
							fontWeight: 560
						}}
					>
						Back to queue
					</button>
					<h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 32px)', color: '#f4f7ff', fontWeight: 560 }}>
						Vehicle Inspection Workspace
					</h2>
					<p style={{ margin: '8px 0 0', color: 'rgba(211,223,242,0.78)' }}>
						Capture field findings once and the officer dashboard consumes this report directly.
					</p>
				</div>

				<div
					style={{
						minWidth: '220px',
						padding: '14px 18px',
						borderRadius: '16px',
						border: '1px solid rgba(255,255,255,0.18)',
						background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))'
					}}
				>
					<div style={{ ...infoLabel, marginBottom: '6px' }}>Current Assignment</div>
					<div style={{ fontSize: '19px', fontWeight: 620, color: '#f2f6ff' }}>{pendingAssignment?.surveyor_name || surveyForm.surveyor_name}</div>
					<div style={{ fontSize: '13px', color: 'rgba(211,223,242,0.78)', marginTop: '4px' }}>
						{pendingAssignment?.surveyor_id || surveyForm.surveyor_id}
					</div>
				</div>
			</div>

			<div
				className="sd-anim-item"
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '16px'
				}}
			>
				<div style={{ ...surfaceCard, padding: '24px' }}>
					<h3 style={{ margin: '0 0 16px', color: '#f2f6ff', fontSize: '17px', fontWeight: 560 }}>Claim Context</h3>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '16px' }}>
						<div>
							<div style={infoLabel}>Claim Number</div>
							<div style={{ marginTop: '6px', color: '#f2f6ff', fontWeight: 620 }}>{selectedClaim?.claim_number}</div>
						</div>
						<div>
							<div style={infoLabel}>Policy Number</div>
							<div style={{ marginTop: '6px', color: '#e6eefc' }}>{selectedPolicy?.policy_number || `Policy ID #${selectedClaim?.policy_id}`}</div>
						</div>
						<div>
							<div style={infoLabel}>Incident Date</div>
							<div style={{ marginTop: '6px', color: '#e6eefc' }}>{formatDate(selectedClaim?.incident_date)}</div>
						</div>
						<div>
							<div style={infoLabel}>Vehicle Number</div>
							<div style={{ marginTop: '6px', color: '#e6eefc' }}>{selectedPolicy?.vehicle_number || 'N/A'}</div>
						</div>
						<div>
							<div style={infoLabel}>Vehicle Model</div>
							<div style={{ marginTop: '6px', color: '#e6eefc' }}>{selectedPolicy?.vehicle_model || 'N/A'}</div>
						</div>
						<div>
							<div style={infoLabel}>Assigned At</div>
							<div style={{ marginTop: '6px', color: '#e6eefc' }}>{formatDateTime(pendingAssignment?.assigned_at)}</div>
						</div>
					</div>

					<div
						style={{
							backgroundColor: 'rgba(255,255,255,0.04)',
							padding: '14px 16px',
							borderRadius: '14px',
							border: '1px solid rgba(255,255,255,0.1)',
							marginBottom: '12px'
						}}
					>
						<div style={infoLabel}>Incident Description</div>
						<p style={{ margin: '8px 0 0', fontSize: '14px', color: '#e6eefc', lineHeight: '1.6' }}>
							{selectedClaim?.description || 'No description provided'}
						</p>
					</div>

					<div
						style={{
							backgroundColor: 'rgba(255,190,92,0.08)',
							padding: '14px 16px',
							borderRadius: '14px',
							border: '1px solid rgba(255,190,92,0.24)'
						}}
					>
						<div style={{ ...infoLabel, color: '#ffd39a' }}>Officer Notes</div>
						<p style={{ margin: '8px 0 0', fontSize: '14px', color: '#ffd39a', lineHeight: '1.6' }}>
							{pendingAssignment?.assignment_notes || 'No special instruction added for this inspection.'}
						</p>
					</div>
				</div>

				<div style={{ display: 'grid', gap: '16px' }}>
					<div style={{ ...surfaceCard, padding: '20px' }}>
						<h3 style={{ margin: '0 0 14px', color: '#f2f6ff', fontSize: '16px', fontWeight: 560 }}>Inspection Checklist</h3>
						{[
							'Verify visible damage against customer description',
							'Capture affected parts clearly',
							'Estimate realistic repair cost',
							'Flag mismatch or fraud risk early'
						].map((item) => (
							<div
								key={item}
								style={{
									display: 'flex',
									gap: '10px',
									alignItems: 'flex-start',
									marginBottom: '10px',
									color: 'rgba(211,223,242,0.82)',
									fontSize: '14px'
								}}
							>
								<span style={{ color: '#a8b7d6', fontWeight: 700 }}>-</span>
								<span>{item}</span>
							</div>
						))}
					</div>

					<div style={{ ...surfaceCard, padding: '20px' }}>
						<h3 style={{ margin: '0 0 14px', color: '#f2f6ff', fontSize: '16px', fontWeight: 560 }}>Survey History</h3>
						{surveyReports.length === 0 ? (
							<div style={{ color: 'rgba(211,223,242,0.78)', fontSize: '14px' }}>No previous survey attempts yet.</div>
						) : (
							surveyReports.map((report) => (
								<div key={report.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
										<div style={{ fontWeight: 620, color: '#f2f6ff' }}>Version {report.version_number}</div>
										<span
											style={{
												padding: '4px 10px',
												borderRadius: '999px',
												...(report.submitted_at
													? {
															backgroundColor: 'rgba(104, 235, 175, 0.14)',
															color: '#8ff0bf',
															border: '1px solid rgba(104, 235, 175, 0.34)'
														}
													: {
															backgroundColor: 'rgba(255, 190, 92, 0.14)',
															color: '#ffd39a',
															border: '1px solid rgba(255, 190, 92, 0.3)'
														}),
												fontSize: '11px',
												fontWeight: 650
											}}
										>
											{report.submitted_at ? 'Submitted' : 'Pending'}
										</span>
									</div>
									<div style={{ fontSize: '12px', color: 'rgba(211,223,242,0.72)', marginTop: '6px' }}>
										Assigned: {formatDateTime(report.assigned_at)}
									</div>
									{report.submitted_at && (
										<div style={{ fontSize: '12px', color: 'rgba(211,223,242,0.72)', marginTop: '4px' }}>
											Submitted: {formatDateTime(report.submitted_at)}
										</div>
									)}
									{report.officer_review_notes && (
										<div style={{ fontSize: '12px', color: '#ffd39a', marginTop: '4px' }}>Officer note: {report.officer_review_notes}</div>
									)}
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</section>
	)

	const renderDamageAssessment = () => (
		<section className="sd-anim-item" style={{ ...surfaceCard, padding: '26px', marginTop: '16px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '22px', flexWrap: 'wrap' }}>
				<div>
					<h3 style={{ margin: 0, color: '#f2f6ff', fontSize: '23px', fontWeight: 560 }}>Damage Assessment Form</h3>
					<p style={{ margin: '8px 0 0', color: 'rgba(211,223,242,0.78)' }}>
						These form fields are synced to officer workflows immediately after submit.
					</p>
				</div>
				{latestSurveyReport?.submitted_at && (
					<span
						style={{
							padding: '8px 14px',
							borderRadius: '999px',
							...getRecommendationTone(latestSurveyReport.recommendation),
							fontWeight: 650,
							fontSize: '12px'
						}}
					>
						Last Recommendation: {toReadableLabel(latestSurveyReport.recommendation)}
					</span>
				)}
			</div>

			<form onSubmit={handleSubmitSurvey}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Surveyor ID</label>
						<input type="text" name="surveyor_id" value={surveyForm.surveyor_id} onChange={handleFormChange} required style={inputStyle} />
					</div>
					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Surveyor Name</label>
						<input type="text" name="surveyor_name" value={surveyForm.surveyor_name} onChange={handleFormChange} style={inputStyle} />
					</div>
				</div>

				<div style={{ marginBottom: '14px' }}>
					<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Damage Description</label>
					<textarea
						name="damage_description"
						value={surveyForm.damage_description}
						onChange={handleFormChange}
						required
						rows="4"
						placeholder="Describe the damage observed during inspection..."
						style={{ ...inputStyle, resize: 'vertical' }}
					/>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Vehicle Condition</label>
						<select name="vehicle_condition" value={surveyForm.vehicle_condition} onChange={handleFormChange} required style={inputStyle}>
							<option value="">Select condition</option>
							<option value="Minor Damage">Minor Damage</option>
							<option value="Moderate Damage">Moderate Damage</option>
							<option value="Severe Damage">Severe Damage</option>
							<option value="Total Loss">Total Loss</option>
						</select>
					</div>

					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Recommendation</label>
						<select name="recommendation" value={surveyForm.recommendation} onChange={handleFormChange} required style={inputStyle}>
							<option value="Repair">Approve for Repair</option>
							<option value="Partial Claim">Partial Claim</option>
							<option value="Total Loss">Total Loss</option>
							<option value="Reject">Reject Claim</option>
							<option value="Further Investigation">Further Investigation Required</option>
						</select>
					</div>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Parts Damaged</label>
						<input
							type="text"
							name="parts_damaged"
							value={surveyForm.parts_damaged}
							onChange={handleFormChange}
							placeholder="Front bumper, bonnet, left headlamp..."
							style={inputStyle}
						/>
					</div>

					<div>
						<label style={{ display: 'block', marginBottom: '7px', fontWeight: 560, color: '#f2f6ff' }}>Estimated Repair Cost</label>
						<input
							type="number"
							name="estimated_repair_cost"
							value={surveyForm.estimated_repair_cost}
							onChange={handleFormChange}
							required
							min="0"
							step="0.01"
							placeholder="0"
							style={inputStyle}
						/>
					</div>
				</div>

				{selectedPolicy?.idv_amount && surveyForm.estimated_repair_cost && (
					<div
						style={{
							marginBottom: '14px',
							padding: '14px 16px',
							borderRadius: '14px',
							backgroundColor: 'rgba(125, 170, 255, 0.12)',
							border: '1px solid rgba(125, 170, 255, 0.26)',
							color: '#d8e5ff',
							display: 'flex',
							justifyContent: 'space-between',
							gap: '12px',
							flexWrap: 'wrap'
						}}
					>
						<span>
							Policy IDV: <strong>{formatCurrency(selectedPolicy.idv_amount)}</strong>
						</span>
						<span>
							Survey Estimate: <strong>{formatCurrency(surveyForm.estimated_repair_cost)}</strong>
						</span>
					</div>
				)}

				{error && (
					<div
						style={{
							color: '#ffc1c1',
							padding: '12px 14px',
							marginBottom: '14px',
							backgroundColor: 'rgba(255, 82, 82, 0.12)',
							borderRadius: '12px',
							border: '1px solid rgba(255, 102, 102, 0.36)'
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				{successMessage && (
					<div
						style={{
							color: '#93f1c3',
							padding: '12px 14px',
							marginBottom: '14px',
							backgroundColor: 'rgba(104, 235, 175, 0.12)',
							borderRadius: '12px',
							border: '1px solid rgba(104, 235, 175, 0.34)'
						}}
					>
						<strong>Success:</strong> {successMessage}
					</div>
				)}

				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
					<div style={{ color: 'rgba(211,223,242,0.72)', fontSize: '13px' }}>
						Tip: Keep parts and recommendation precise so the officer can proceed without callback.
					</div>
					<button
						type="submit"
						disabled={loading}
						style={{
							padding: '12px 26px',
							cursor: loading ? 'not-allowed' : 'pointer',
							opacity: loading ? 0.66 : 1,
							background: 'linear-gradient(145deg, #f6f8ff, #dce7f9)',
							color: '#11151e',
							border: '1px solid rgba(255,255,255,0.6)',
							borderRadius: '999px',
							fontWeight: 650,
							fontSize: '14px'
						}}
					>
						{loading ? 'Submitting...' : 'Submit Survey Report'}
					</button>
				</div>
			</form>
		</section>
	)

	return (
		<div
			ref={dashboardRef}
			style={{
				minHeight: '100vh',
				background:
					'radial-gradient(130% 120% at 12% 6%, rgba(84, 110, 255, 0.26), transparent 45%), radial-gradient(120% 110% at 88% 10%, rgba(87, 204, 153, 0.2), transparent 48%), linear-gradient(180deg, #0b0d14 0%, #0f121a 50%, #0a0d15 100%)',
				color: '#f5f8ff',
				fontFamily: FONT_STACK,
				position: 'relative',
				overflow: 'hidden'
			}}
		>
			<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
				<div
					ref={(node) => {
						ambientOrbRefs.current[0] = node
					}}
					style={{
						position: 'absolute',
						width: '320px',
						height: '320px',
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(105,146,255,0.32), rgba(105,146,255,0))',
						top: '-80px',
						left: '-70px',
						filter: 'blur(2px)'
					}}
				/>
				<div
					ref={(node) => {
						ambientOrbRefs.current[1] = node
					}}
					style={{
						position: 'absolute',
						width: '260px',
						height: '260px',
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(93,232,183,0.2), rgba(93,232,183,0))',
						top: '18%',
						right: '-80px'
					}}
				/>
				<div
					ref={(node) => {
						ambientOrbRefs.current[2] = node
					}}
					style={{
						position: 'absolute',
						width: '280px',
						height: '280px',
						borderRadius: '50%',
						background: 'radial-gradient(circle, rgba(189,142,255,0.16), rgba(189,142,255,0))',
						bottom: '-110px',
						left: '30%'
					}}
				/>
			</div>

			<div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '24px clamp(16px, 3vw, 34px) 34px' }}>
				<header
					className="sd-anim-item"
					style={{
						borderRadius: '24px',
						padding: '18px clamp(16px, 2.6vw, 30px)',
						background: 'linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))',
						border: '1px solid rgba(255,255,255,0.18)',
						boxShadow: '0 26px 58px rgba(0,0,0,0.4)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: '16px',
						flexWrap: 'wrap'
					}}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 34px)', color: '#f6f9ff', fontWeight: 560 }}>Surveyor Dashboard</h1>
						<div style={{ marginTop: '7px', color: 'rgba(211,223,242,0.78)', fontSize: '13px' }}>
							Assignment-aware field inspection workspace
						</div>
					</div>
					<button
						onClick={onSwitchRole}
						style={{
							padding: '10px 18px',
							background: 'rgba(255,255,255,0.06)',
							color: '#f4f7ff',
							border: '1px solid rgba(255,255,255,0.24)',
							borderRadius: '999px',
							cursor: 'pointer',
							fontWeight: 560
						}}
					>
						Logout
					</button>
				</header>

				<main style={{ marginTop: '20px' }}>
					{view === 'queue' && (
						<div ref={queueViewRef}>
							{renderQueue()}
						</div>
					)}
					{view === 'inspect' && selectedClaim && (
						<div ref={inspectViewRef}>
							{renderInspectionPanel()}
							{renderDamageAssessment()}
						</div>
					)}
				</main>
			</div>
		</div>
	)
}

export default SurveyorDashboard
