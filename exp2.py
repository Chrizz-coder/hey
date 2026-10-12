import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_squared_error, r2_score

# 1. Load dataset
data = fetch_openml(name='autoMpg', version=1, as_frame=True)
df = data.frame.dropna()
# 2. Select feature and target
X = df[['displacement']]
y = df['class']

# 3. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 4. Linear Regression
linear = LinearRegression()
linear.fit(X_train, y_train)
y_pred = linear.predict(X_test)

print("Linear Regression")
print("MSE:", mean_squared_error(y_test, y_pred))
print("R2:", r2_score(y_test, y_pred))

# 5. Polynomial Regression
results = {}

print("\nPolynomial Regression")
print("\tMSE \t R2_Score")
for degree in [2, 3]:
    poly = PolynomialFeatures(degree=degree, include_bias=False)

    X_train_poly = poly.fit_transform(X_train)
    X_test_poly = poly.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_poly, y_train)

    y_pred_poly = model.predict(X_test_poly)

    print(f"Degree {degree}", end=" ")
    print(
        mean_squared_error(y_test, y_pred_poly),
        r2_score(y_test, y_pred_poly)
    )



# 6. Plot
plt.figure(figsize=(10, 6))
plt.scatter(X_test, y_test, color='gray', alpha=0.6, label='Actual Data')

# Smooth X values for drawing curves
x_range = pd.DataFrame(
    np.linspace(X.min(), X.max(), 500),
    columns=['displacement']
)

# Linear line
plt.plot(
    x_range,
    linear.predict(x_range),
    color='red',
    linestyle='--',
    label='Linear Fit'
)

# Polynomial curves
for degree, color in [(2, 'blue'), (3, 'green'), (4, 'orange')]:
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_train_poly = poly.fit_transform(X_train)
    X_range_poly = poly.transform(x_range)

    model = LinearRegression()
    model.fit(X_train_poly, y_train)

    plt.plot(
        x_range,
        model.predict(X_range_poly),
        color=color,
        label=f'Polynomial Degree {degree}'
    )

plt.title('Engine Displacement vs Fuel Efficiency')
plt.xlabel('Engine Displacement')
plt.ylabel('Miles Per Gallon (MPG)')
plt.legend()
plt.grid(True, linestyle=':', alpha=0.6)
plt.show()
