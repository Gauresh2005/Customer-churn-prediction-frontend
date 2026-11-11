import { useState, useEffect } from "react";
import { ChartNoAxesCombined, LayoutGridCircles, Target, FileChartColumn, TriangleExclamationPoint, SquareCheckBig } from 'lucide-react'
import "./App.css"

const API_BASE_URL = 'https://customer-churn-prediction-api-e0go.onrender.com'
const initialFormData = {
  tenure: '',
  MonthlyCharges: '',
  Contract: 'Month-to-month',
  gender: 'Male',
  SeniorCitizen: '0',
  Partner: 'No',
  Dependents: 'No',
  PhoneService: 'No',
  MultipleLines: 'No',
  InternetService: 'Fiber optic',
  OnlineSecurity: 'No',
  OnlineBackup: 'No',
  DeviceProtection: 'No',
  TechSupport: 'No',
  StreamingTV: 'No',
  StreamingMovies: 'No',
  PaperlessBilling: 'No',
  PaymentMethod: 'Electronic check',
  TotalCharges: ''
}

function App() {
  const [formData, setFormData] = useState(initialFormData)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeNav, setActiveNav] = useState("dashboard")
  const [apiStatus, setApiStatus] = useState("checking")
  const [predictionHistory, setPredictionHistory] = useState(() => {
    const savedHistory = localStorage.getItem("predictionHistory")
    return savedHistory ? JSON.parse(savedHistory): []
  })
  const [selectedCurrency, setSelectedCurrency] = useState("INR")
  const [exchangeRate, setExchangeRate] = useState(null)
  const [rateDate, setRateDate] = useState("")
  const [rateLoading, setRateLoading] = useState(true)
  const [rateError, setRateError] = useState("")

  const totalPredictions = predictionHistory.length
  const churnPredictions = predictionHistory.filter((entry) => entry.prediction === "Churn").length
  const noChurnPredictions = predictionHistory.filter((entry) => entry.prediction === "No Churn").length

  const handleChange = (event) => {
    const {name, value} = event.target
    setFormData((previousData) => ({
      ...previousData, [name]: value,
    }))
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setResult(null)
    setError('')
  }

  const validateForm = () => {
    const tenure = formData.tenure.trim()
    const monthlyCharges = formData.MonthlyCharges.trim()
    const totalCharges = formData.TotalCharges.trim()

    if (!tenure || !monthlyCharges || !totalCharges) {
      return "Please enter all required numeric fields"
    }

    const tenureValue = Number(tenure)
    const monthlyValue = Number(monthlyCharges)
    const totalValue = Number(totalCharges)

    if (!Number.isFinite(tenureValue) || !Number.isInteger(tenureValue) || tenureValue < 0 || tenureValue > 72) {
      return "Tenure must be a whole number between 0 and 72."
    }

    if (!Number.isFinite(monthlyValue) || monthlyValue < 0) {
      return "Monthly charges must be a valid non-negative number"
    }
    if (!Number.isFinite(totalValue) || totalValue < 0) {
      return "Total charges must be a valid non-negative number"
    }

    return null
  }

  const handleSubmit =  async (event) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (selectedCurrency === "INR" && (!exchangeRate || rateLoading)) {
      setError(
        rateLoading ? "Exchange rate is still loading. Please try again later." : rateError || "Exchange rate unavailable, please try again later."
      )
      return
    }

    const conversionRate = selectedCurrency === "INR" ? exchangeRate: 1
    
    const payload = {
      ...formData,
      tenure: Number(formData.tenure), 
      MonthlyCharges: Number(Number(formData.MonthlyCharges) * conversionRate).toFixed(2),
      SeniorCitizen: Number(formData.SeniorCitizen),
      TotalCharges: Number(Number(formData.TotalCharges) * conversionRate).toFixed(2)
    }

    setLoading(true)
    setError('')
    setResult(null)

    let response = null
    try {
      response = await fetch(
        `${API_BASE_URL}/predict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload)
        }
      )

      const contentType = response.headers.get("content-type")
      let data = null

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      }

      if(!response.ok){
        if (response.status === 422) {
          throw new Error("Invalid customer information, please check your inputs.")
        }
        if (response.status >= 500) {
          throw new Error("The prediction server encountered an error, please try again later.")
        }
        throw new Error(
          data?.detail ? "Prediction failed:" + JSON.stringify(data.detail) : `Request failed with status${response.status}.`
        )
      }

      if (!data || !Number.isFinite(data.churn_probability) || !data.prediction_label) {
        throw new Error("The API returned an invalid prediction response.")
      }

      setResult(data)

      const historyEntry = {
        id: Date.now(),
        tenure: formData.tenure,
        monthlyCharges: formData.MonthlyCharges,
        contract: formData.Contract,
        prediction: data.prediction_label,
        churnProbability: data.churn_probability,
        timestamp: new Date().toLocaleString(),
        currency: selectedCurrency
      }

      setPredictionHistory((previousHistory) => [historyEntry, ...previousHistory])

      console.log("Prediction result: ", data);
    } catch (error) {
      if (response === null) {
        setError("Unable to connect to the prediction API. Please check your internet connection or try again later.")
      } else {
        setError(error.message || "An unexpected error occcured.")
      }
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const checkApiStatus = async () => {
      try {
        const response = await fetch(API_BASE_URL,
          {cache: 'no-store'}
        )

        if (!response.ok) {
          throw new Error("API unavailable")
        }

        const data = await response.json()

        if (data.status !== 'healthy') {
          throw new Error("API unhealthy")
        }

        if (isMounted){
          setApiStatus("connected")
        }
      } catch (error) {
        if (!isMounted){
          setApiStatus("disconnected")
        }
      }
    }
    checkApiStatus()

    const intervalId = setInterval(checkApiStatus, 30000)
    console.log(intervalId);

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("predictionHistory", JSON.stringify(predictionHistory))
  },[predictionHistory])

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setRateLoading(true)
        setRateError("")

        const response = await fetch("https://api.frankfurter.dev/v2/rate/INR/USD")

        if (!response.ok) {
          throw new Error("Unable to fetch exchange rate.")
        }
        const data = await response.json()
        console.log(data)

        if (!Number.isFinite(data.rate) || data.rate <= 0) {
          throw new Error("Invalid exchange rate received.")
        }
        setExchangeRate(data.rate)
        setRateDate(data.date)
      } catch (error) {
        setRateError(error.message)
      }
      finally {
        setRateLoading(false)
      }
    }

    fetchExchangeRate()
  },[])

return (
  <div className="app-layout">

    {/* Sidebar */}
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">CP</div>
        <h2>ChurnPredict</h2>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">MENU</p>

        <nav className="sidebar-nav">
          <a
            href="#dashboard"
            className={`nav-link ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveNav("dashboard")}
          >
            <span><LayoutGridCircles /></span> Dashboard
          </a>
          <a
            href="#prediction"
            className={`nav-link ${activeNav === "prediction" ? "active" : ""}`}
            onClick={() => setActiveNav("prediction")}
          >
            <span><Target /></span> Prediction
          </a>
          <a
            href="#results"
            className={`nav-link ${activeNav === "results" ? "active" : ""}`}
            onClick={() => setActiveNav("results")}
          >
            <span><FileChartColumn /></span> Results
          </a>
        </nav>

      </div>

      <div className="sidebar-footer">
        <p>Customer Analytics</p>
        <span>Churn Prediction System</span>
      </div>
    </aside>

    {/* Main Area */}
    <div className="main-wrapper">

      {/* Header */}
      <header className="topbar">
        <div>
          <h3>Customer Analytics</h3>
          <p>Prediction Dashboard</p>
        </div>

        <div className={`header-status ${apiStatus}`}>
          <span className="status-dot"></span>
          {
            apiStatus === "checking" ? "Checking API...": apiStatus === "connected" ? "API connected": "API disconnected" 
          }
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="dashboard-content" id="dashboard">

        <section className="page-heading">
          <div>
            <h1>Customer Churn Prediction</h1>
            <p>
              Analyze customer information and identify
              potential churn risks.
            </p>
          </div>
        </section>

        {/* Dashboard statistics */}
        <section className="statistics-grid">
          <div className="stat-card">
            <div className="stat-card-icon"><ChartNoAxesCombined /></div>
            <div>
              <p>Total Predictions</p>
              <h2>{totalPredictions}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon"><TriangleExclamationPoint color="#da2b2b"/></div>
            <div>
              <p>Churn Predictions</p>
              <h2>{churnPredictions}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon"><SquareCheckBig color="#23e726" strokeWidth={2.2}/></div>
            <div>
              <p>No Churn Predictions</p>
              <h2>{noChurnPredictions}</h2>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">

          {/* Input Form */}
          <div className="panel form-panel" id="prediction">
            <div className="panel-heading">
              <h2>Customer Information</h2>
              <p>Enter the customer's details below.</p>
            </div>

            {
              <form onSubmit={handleSubmit}>
              {/* Customer demographics */}
              {/* gender */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="gender">
                    Gender
                  </label>
                  <select name="gender" id="gender" value={formData.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

              {/* SeniorCitizen */}

                <div className="form-group">
                  <label htmlFor="SeniorCitizen">
                    Is a senior citizen?
                  </label>
                  <select name="SeniorCitizen" id="SeniorCitizen" value={formData.SeniorCitizen} onChange={handleChange}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>

              {/* Partner */}

                <div className="form-group">
                  <label htmlFor="Partner">
                    Has any Partner?
                  </label>
                  <select name="Partner" id="Partner" value={formData.Partner} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

              {/* Dependents */}

                <div className="form-group">
                  <label htmlFor="Dependents">
                    Has any dependents?
                  </label>
                  <select name="Dependents" id="Dependents" value={formData.Dependents} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Account Information */}

              <div className="form-section">

                <div className="section-heading">
                  <h3>Account Information</h3>
                  <p>Enter the customer's account details.</p>
                </div>

                <div className="form-grid">

                  {/* Tenure */}
                  <div className="form-group">
                    <label htmlFor="tenure">Tenure (months)</label>

                    <input
                      type="number"
                      name="tenure"
                      id="tenure"
                      min="0"
                      max="72"
                      step="1"
                      value={formData.tenure}
                      onChange={handleChange}
                      placeholder="Enter tenure"
                      required
                    />
                  </div>

                  {/* Contract */}
                  <div className="form-group">
                    <label htmlFor="contract">Contract Type</label>

                    <select
                      name="Contract"
                      id="contract"
                      value={formData.Contract}
                      onChange={handleChange}
                    >
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="One Year">One Year</option>
                      <option value="Two Year">Two Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Services & Subscriptions */}

              <div className="form-section">

                <div className="section-heading">
                  <h3>Services & Subscriptions</h3>
                  <p>Enter the customer's subscribed services.</p>
                </div>

                <div className="form-grid">

                  {/* Phone Service */}
                  <div className="form-group">
                    <label htmlFor="phoneService">Phone Service</label>
                    <select
                      name="PhoneService"
                      id="phoneService"
                      value={formData.PhoneService}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* Multiple Lines */}
                  <div className="form-group">
                    <label htmlFor="multipleLines">Multiple Lines</label>
                    <select
                      name="MultipleLines"
                      id="multipleLines"
                      value={formData.MultipleLines}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No phone service">No phone service</option>
                    </select>
                  </div>

                  {/* Internet Service */}
                  <div className="form-group">
                    <label htmlFor="internetService">Internet Service</label>
                    <select
                      name="InternetService"
                      id="internetService"
                      value={formData.InternetService}
                      onChange={handleChange}
                    >
                      <option value="DSL">DSL</option>
                      <option value="Fiber optic">Fiber optic</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* Online Security */}
                  <div className="form-group">
                    <label htmlFor="onlineSecurity">Online Security</label>
                    <select
                      name="OnlineSecurity"
                      id="onlineSecurity"
                      value={formData.OnlineSecurity}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                  {/* Online Backup */}
                  <div className="form-group">
                    <label htmlFor="onlineBackup">Online Backup</label>
                    <select
                      name="OnlineBackup"
                      id="onlineBackup"
                      value={formData.OnlineBackup}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                  {/* Device Protection */}
                  <div className="form-group">
                    <label htmlFor="deviceProtection">Device Protection</label>
                    <select
                      name="DeviceProtection"
                      id="deviceProtection"
                      value={formData.DeviceProtection}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                  {/* Tech Support */}
                  <div className="form-group">
                    <label htmlFor="techSupport">Tech Support</label>
                    <select
                      name="TechSupport"
                      id="techSupport"
                      value={formData.TechSupport}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                  {/* Streaming TV */}
                  <div className="form-group">
                    <label htmlFor="streamingTV">Streaming TV</label>
                    <select
                      name="StreamingTV"
                      id="streamingTV"
                      value={formData.StreamingTV}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                  {/* Streaming Movies */}
                  <div className="form-group">
                    <label htmlFor="streamingMovies">Streaming Movies</label>
                    <select
                      name="StreamingMovies"
                      id="streamingMovies"
                      value={formData.StreamingMovies}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="No internet service">No internet service</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Billing Information */}

              <div className="form-section">

                <div className="section-heading">
                  <h3>Billing Information</h3>
                  <p>Enter the customer's billing and payment details.</p>
                </div>

                <div className="form-grid">

                  {/* Currency selector */}
                  <div className="form-group">
                    <label htmlFor="currency">Currency</label>
                    <select name="currency" id="currency" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
                      <option value="INR">INR (Indian Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                    </select>
                  </div>
                  {
                    selectedCurrency === "INR" && (
                      <div className="exchange_rate_info">
                        {rateLoading ? (
                          <p>Fetching exchange rate...</p>
                        ) : rateError ? (
                          <p>{rateError}</p>
                        ) : (
                          <p>1 INR = {exchangeRate.toFixed(6)}USD
                            <br />
                            <small>Rate Date: {rateDate}</small>
                          </p>
                        )}
                      </div>
                    )
                  }

                  {/* Monthly Charges */}
                  <div className="form-group">
                    <label htmlFor="monthlyCharges">
                      Monthly Charges
                    </label>

                    <input
                      type="number"
                      name="MonthlyCharges"
                      id="monthlyCharges"
                      min="0"
                      step="0.01"
                      value={formData.MonthlyCharges}
                      onChange={handleChange}
                      placeholder="Enter monthly charges"
                      required
                    />
                  </div>

                  {/* Total Charges */}
                  <div className="form-group">
                    <label htmlFor="totalCharges">
                      Total Charges
                    </label>

                    <input
                      type="number"
                      name="TotalCharges"
                      id="totalCharges"
                      min="0"
                      step="0.01"
                      value={formData.TotalCharges}
                      onChange={handleChange}
                      placeholder="Enter total charges"
                      required
                    />
                  </div>

                  {/* Paperless Billing */}
                  <div className="form-group">
                    <label htmlFor="paperlessBilling">
                      Paperless Billing
                    </label>

                    <select
                      name="PaperlessBilling"
                      id="paperlessBilling"
                      value={formData.PaperlessBilling}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="form-group">
                    <label htmlFor="paymentMethod">
                      Payment Method
                    </label>

                    <select
                      name="PaymentMethod"
                      id="paymentMethod"
                      value={formData.PaymentMethod}
                      onChange={handleChange}
                    >
                      <option value="Bank transfer (automatic)">
                        Bank transfer (automatic)
                      </option>
                      <option value="Credit card (automatic)">
                        Credit card (automatic)
                      </option>
                      <option value="Electronic check">
                        Electronic check
                      </option>
                      <option value="Mailed check">
                        Mailed check
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="predict-button" disabled={loading}>
                  {loading ? 'Predicting...': 'Predict churn'}
                </button>

                <button type="button"className="reset-button" onClick={handleReset} disabled={loading}>
                  Reset Form
                </button>
              </div>
            </form>
            }

          </div>

          {/* Prediction Result */}
          <div className="right-column" id="results">

            <div className="panel result-panel">
              <h2>Prediction Result</h2>

              {!result && !loading && !error && (
                <div className="empty-result">
                  <div className="empty-icon"><ChartNoAxesCombined /></div>
                  <h3>No prediction yet</h3>
                  <p>
                    Submit customer information to
                    see the prediction.
                  </p>
                </div>
              )}

              {  
                result && (
                  <div className="prediction-result">

                    {/* Prediction status */}
                    <div className="result-status">
                      <span className={result.prediction === 1 ? "status-badge churn-badge": "status-badge no-churn-badge"}>
                        {result.prediction_label}
                      </span>
                    </div>

                    {/* Churn probability */}
                    <div className="probability-section">
                      <p className="probability-label">
                        Churn Probability
                      </p>
                      <h1 className="probability-value">
                        {(result.churn_probability * 100).toFixed(2)}%
                      </h1>

                      {/* Progress bar */}
                        <div className="progress-track">
                          <div className={result.prediction === 1 ? "progress-fill churn-fill": "progress-fill no-churn-fill"} style={{width: `${result.churn_probability * 100}%`}}>
                        </div>
                      </div>

                    </div>

                    {/* Prediction description */}
                    <div className="result-description">
                      <h3>
                        {result.prediction === 1 ? "Customer likely to leave": "Customer likely to stay"}
                      </h3>
                      <p>
                        {result.prediction === 1 ? "The model predicts that this customer is likely to discontinue the service.": "The model predicts that this customer is likely to continue using this service"}
                      </p>
                    </div>
                    
                  </div>
                )
              }

              {loading && (
                <p className="loading-message">
                  Analyzing customer information...
                </p>
              )}

              {error && (
                <p className="error-message">{error}</p>
              )}

            </div>

          </div>

        </section>

        <div className="panel history-panel">
          <div className="history-header">
            <h2>Prediction History</h2>

            <button className="clear-history-btn" type="button" onClick={() => setPredictionHistory([])} disabled={predictionHistory.length === 0}>Clear History</button>

          </div>
          {
            predictionHistory.length === 0 ? (
            <div className="empty-history">
              <p>No prediction history available</p>
              <span>Your predicions will appear here</span>
            </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead> 
                    <tr>
                      <th>Date and Time</th>
                      <th>Tenure</th>
                      <th>Monthly Charges</th>
                      <th>Contract</th>
                      <th>Prediction</th>
                      <th>Churn Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      predictionHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.timestamp}</td>
                          <td>{entry.tenure} months</td>
                          <td>{Number(entry.monthlyCharges).toFixed(2)}.</td>
                          <td>{entry.contract}</td>

                          <td>
                            <span className={entry.prediction === "Churn" ? "status-badge churn-badge": "status-badge no-churn-badge"}>
                            {entry.prediction}
                            </span>
                          </td>

                          <td>
                            {(entry.churnProbability * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </main>
    </div>
  </div>
);
}

export default App;
