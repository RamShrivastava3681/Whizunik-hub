import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score

# --- Step 1: Create SME Trade Finance Dataset ---
print("Creating SME Trade Finance Dataset...")

# Set random seed for reproducibility
np.random.seed(42)

# Generate synthetic dataset with SME financial features
n_samples = 1000

data = pd.DataFrame({
    'current_ratio': np.random.uniform(0.5, 4.0, n_samples),
    'debt_to_equity': np.random.uniform(0.1, 8.0, n_samples),
    'ebitda_margin': np.random.uniform(-0.2, 0.4, n_samples),
    'customer_concentration': np.random.uniform(0.1, 0.9, n_samples),
    'years_in_operation': np.random.randint(1, 25, n_samples),
    'trade_volume': np.random.uniform(100_000, 50_000_000, n_samples)
})

# Create realistic default probability based on financial health
def calculate_default_probability(row):
    # Lower current ratio increases risk
    current_ratio_risk = 1 / (1 + row['current_ratio'])
    
    # Higher debt to equity increases risk
    debt_risk = row['debt_to_equity'] / 10
    
    # Negative EBITDA margin increases risk significantly
    ebitda_risk = max(0, -row['ebitda_margin'] * 2)
    
    # High customer concentration increases risk
    concentration_risk = row['customer_concentration'] * 0.5
    
    # Newer companies have higher risk
    operation_risk = 1 / (1 + row['years_in_operation'] / 10)
    
    # Lower trade volume increases risk slightly
    volume_risk = 1 / (1 + row['trade_volume'] / 10_000_000)
    
    # Combine all risk factors
    total_risk = (current_ratio_risk + debt_risk + ebitda_risk + 
                  concentration_risk + operation_risk + volume_risk) / 6
    
    return min(0.8, max(0.05, total_risk))  # Cap between 5% and 80%

# Calculate default probabilities and create binary target
data['default_prob'] = data.apply(calculate_default_probability, axis=1)
data['default'] = (np.random.random(n_samples) < data['default_prob']).astype(int)

# Remove the probability column (keep only binary target)
data = data.drop('default_prob', axis=1)

print(f"Dataset shape: {data.shape}")
print(f"Default rate: {data['default'].mean():.2%}")
print(f"Features: {list(data.columns[:-1])}")
print("\nDataset statistics:")
print(data.describe())

# --- Step 2: Train-test split ---
X = data.drop('default', axis=1)
y = data['default']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# --- Step 3: Train model (GBM) ---
model = GradientBoostingClassifier()
model.fit(X_train, y_train)

# --- Step 4: Predict default probability ---
y_pred_prob = model.predict_proba(X_test)[:,1]

# --- Step 5: Convert PD to Trade Finance Risk Score (0-100 scale) ---
def prob_to_score(prob, min_score=0, max_score=100):
    return max_score - (prob * (max_score - min_score))

scores = [prob_to_score(p) for p in y_pred_prob]

# --- Step 6: Evaluate ---
auc = roc_auc_score(y_test, y_pred_prob)
print(f"\nModel Performance:")
print(f"ROC-AUC: {auc:.3f}")
print(f"\nSample Credit Risk Scores (0-100, higher = better credit):")
for i, score in enumerate(scores[:10]):
    risk_level = "Low Risk" if score > 70 else "Medium Risk" if score > 40 else "High Risk"
    print(f"Customer {i+1}: {score:.1f} ({risk_level})")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\nTop 5 Most Important Features:")
for idx, row in feature_importance.head().iterrows():
    print(f"{row['feature']}: {row['importance']:.3f}")

# --- Step 7: Predict Credit Score for New Customer ---
def predict_new_customer():
    print("\n" + "="*60)
    print("SME TRADE FINANCE CREDIT SCORE PREDICTION")
    print("="*60)
    
    new_customer = {}
    
    print("\nPlease enter the following SME financial information:")
    
    # Get current ratio
    while True:
        try:
            current_ratio = float(input("Current Ratio (current assets/current liabilities, e.g., 1.8): "))
            if current_ratio > 0:
                new_customer['current_ratio'] = current_ratio
                break
            else:
                print("Current ratio must be positive")
        except ValueError:
            print("Please enter a valid number")
    
    # Get debt to equity ratio
    while True:
        try:
            debt_to_equity = float(input("Debt-to-Equity Ratio (total debt/total equity, e.g., 1.5): "))
            if debt_to_equity >= 0:
                new_customer['debt_to_equity'] = debt_to_equity
                break
            else:
                print("Debt-to-equity ratio must be non-negative")
        except ValueError:
            print("Please enter a valid number")
    
    # Get EBITDA margin
    while True:
        try:
            ebitda_margin = float(input("EBITDA Margin (as decimal, e.g., 0.12 for 12%): "))
            if -1 <= ebitda_margin <= 1:
                new_customer['ebitda_margin'] = ebitda_margin
                break
            else:
                print("EBITDA margin should be between -1 and 1")
        except ValueError:
            print("Please enter a valid number")
    
    # Get customer concentration
    while True:
        try:
            customer_concentration = float(input("Customer Concentration (% of revenue from top clients as decimal, e.g., 0.45): "))
            if 0 <= customer_concentration <= 1:
                new_customer['customer_concentration'] = customer_concentration
                break
            else:
                print("Customer concentration should be between 0 and 1")
        except ValueError:
            print("Please enter a valid number")
    
    # Get years in operation
    while True:
        try:
            years_in_operation = int(input("Years in Operation (e.g., 6): "))
            if years_in_operation > 0:
                new_customer['years_in_operation'] = years_in_operation
                break
            else:
                print("Years in operation must be positive")
        except ValueError:
            print("Please enter a valid number")
    
    # Get trade volume
    while True:
        try:
            trade_volume = float(input("Annual Trade Volume (in currency units, e.g., 5000000): "))
            if trade_volume > 0:
                new_customer['trade_volume'] = trade_volume
                break
            else:
                print("Trade volume must be positive")
        except ValueError:
            print("Please enter a valid number")
    
    # Create DataFrame for prediction
    customer_df = pd.DataFrame([new_customer])
    
    # Predict probability and convert to score
    prob = model.predict_proba(customer_df)[0][1]
    credit_score = prob_to_score(prob)
    
    # Determine risk level and recommendation
    if credit_score > 70:
        risk_level = "LOW RISK"
        recommendation = "APPROVE - Excellent creditworthiness"
    elif credit_score > 50:
        risk_level = "MEDIUM RISK"
        recommendation = "REVIEW - Consider with conditions"
    else:
        risk_level = "HIGH RISK"
        recommendation = "DECLINE - High default probability"
    
    # Display results with business interpretation
    print("\n" + "="*60)
    print("SME CREDIT ASSESSMENT RESULTS")
    print("="*60)
    print(f"Credit Score: {credit_score:.1f}/100")
    print(f"Risk Level: {risk_level}")
    print(f"Default Probability: {prob:.1%}")
    print(f"Recommendation: {recommendation}")
    
    # Provide insights based on key ratios
    print("\nKey Financial Health Indicators:")
    if new_customer['current_ratio'] >= 1.5:
        print("✓ Strong liquidity position")
    elif new_customer['current_ratio'] >= 1.0:
        print("⚠ Adequate liquidity")
    else:
        print("✗ Weak liquidity position")
    
    if new_customer['debt_to_equity'] <= 2.0:
        print("✓ Conservative debt levels")
    elif new_customer['debt_to_equity'] <= 4.0:
        print("⚠ Moderate debt levels")
    else:
        print("✗ High debt levels")
    
    if new_customer['ebitda_margin'] >= 0.1:
        print("✓ Strong profitability")
    elif new_customer['ebitda_margin'] >= 0:
        print("⚠ Marginal profitability")
    else:
        print("✗ Operating losses")
    
    print("="*60)
    
    return credit_score, risk_level, recommendation

# Ask user if they want to predict for a new customer
while True:
    user_choice = input("\nDo you want to predict credit score for a new SME customer? (y/n): ").lower()
    if user_choice == 'y':
        predict_new_customer()
    elif user_choice == 'n':
        print("Thank you for using the SME Trade Finance Credit Risk Assessment System!")
        break
    else:
        print("Please enter 'y' for yes or 'n' for no")