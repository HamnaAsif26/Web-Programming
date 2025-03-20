document.addEventListener("DOMContentLoaded", () => {
    // Common regex patterns for validation
    const patterns = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      name: /^[a-zA-Z\s'-]{2,}$/,
      password: {
        minLength: 8,
        hasNumber: /[0-9]/,
        hasSpecial: /[^A-Za-z0-9]/,
      },
    }
  
    // Initialize Bootstrap's Modal component
    const bootstrap = window.bootstrap
  
    // Common utility functions
    function togglePasswordVisibility(inputField, toggleIcon) {
      if (inputField.type === "password") {
        inputField.type = "text"
        toggleIcon.innerHTML = '<i class="fa fa-eye"></i>'
      } else {
        inputField.type = "password"
        toggleIcon.innerHTML = '<i class="fa fa-eye-slash"></i>'
      }
    }
  
    function validateField(element, pattern, errorMessage) {
      if (!element) return false
  
      const value = element.value.trim()
      let isValid = false
  
      if (pattern instanceof RegExp) {
        isValid = pattern.test(value)
      } else if (typeof pattern === "function") {
        isValid = pattern(value)
      }
  
      if (!isValid) {
        setInvalidState(element, errorMessage)
        return false
      } else {
        element.classList.remove("is-invalid")
        element.setCustomValidity("")
        return true
      }
    }
  
    function validatePassword(password) {
      if (!password || password.length < patterns.password.minLength) {
        return { valid: false, message: "Password must be at least 8 characters" }
      }
  
      if (!patterns.password.hasNumber.test(password)) {
        return { valid: false, message: "Password must contain at least one number" }
      }
  
      if (!patterns.password.hasSpecial.test(password)) {
        return { valid: false, message: "Password must contain at least one special character" }
      }
  
      return { valid: true }
    }
  
    function resetValidationState(form) {
      if (!form) return
  
      const formElements = form.querySelectorAll(".form-control, .form-check-input")
      formElements.forEach((element) => {
        element.classList.remove("is-invalid")
        element.setCustomValidity("")
      })
    }
  
    function setInvalidState(element, message) {
      if (!element) return
  
      element.classList.add("is-invalid")
      element.setCustomValidity(message)
  
      // Find the associated feedback element and update its text
      const feedbackElement = element.nextElementSibling
      if (feedbackElement && feedbackElement.classList.contains("invalid-feedback")) {
        feedbackElement.textContent = message
      }
    }
  
    function updatePasswordStrength(strengthElement, strength) {
      if (!strengthElement) return
  
      switch (strength) {
        case 0:
          strengthElement.style.width = "0%"
          strengthElement.style.backgroundColor = ""
          break
        case 1:
          strengthElement.style.width = "30%"
          strengthElement.style.backgroundColor = "#f44336" // Red - Very Weak
          break
        case 2:
          strengthElement.style.width = "60%"
          strengthElement.style.backgroundColor = "#ff9800" // Orange - Weak
          break
        case 3:
          strengthElement.style.width = "100%"
          strengthElement.style.backgroundColor = "#4caf50" // Green - Strong
          break
      }
    }
  
    function checkPasswordMatch(passwordField, confirmPasswordField) {
      const passwordMatchIndicator = confirmPasswordField.parentNode.parentNode.querySelector(".password-match-indicator")
      if (!passwordMatchIndicator) return
  
      passwordMatchIndicator.style.display = "block"
  
      if (passwordField.value === confirmPasswordField.value) {
        passwordMatchIndicator.textContent = "✓ Passwords match"
        passwordMatchIndicator.className = "password-match-indicator mt-1 text-success"
        confirmPasswordField.setCustomValidity("")
        confirmPasswordField.classList.remove("is-invalid")
      } else {
        passwordMatchIndicator.textContent = "✗ Passwords do not match"
        passwordMatchIndicator.className = "password-match-indicator mt-1 text-danger"
        confirmPasswordField.setCustomValidity("Passwords don't match")
        confirmPasswordField.classList.add("is-invalid")
      }
    }
  
    // Social buttons functionality
    const socialButtons = document.querySelectorAll(".btn-social")
    socialButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const provider = this.textContent.trim()
        alert(`Signing in with ${provider}...`)
        // Implement actual social login functionality here
      })
    })
  
    // ==================== SIGNUP FORM VALIDATION ====================
    const signupForm = document.getElementById("signupForm")
    if (signupForm) {
      const firstName = document.getElementById("firstName")
      const lastName = document.getElementById("lastName")
      const email = document.getElementById("email")
      const password = document.getElementById("password")
      const confirmPassword = document.getElementById("confirmPassword")
      const termsCheck = document.getElementById("termsCheck")
      const newsletterCheck = document.getElementById("newsletterCheck")
      const passwordStrength = document.getElementById("passwordStrength")
      const passwordToggle = document.getElementById("passwordToggle")
      const confirmPasswordToggle = document.getElementById("confirmPasswordToggle")
  
      // Create password requirements list if it doesn't exist
      if (!document.querySelector(".password-requirements")) {
        const passwordRequirementsList = document.createElement("div")
        passwordRequirementsList.className = "password-requirements mt-2"
        passwordRequirementsList.innerHTML = `
            <p class="text-white mb-1" style="font-size: 0.8rem;">Password must contain:</p>
            <ul class="ps-3 mb-0" style="font-size: 0.8rem;">
                <li id="req-length" class="text-danger">At least 8 characters</li>
                <li id="req-number" class="text-danger">At least one number</li>
                <li id="req-special" class="text-danger">At least one special character</li>
            </ul>
        `
        passwordStrength.parentNode.insertBefore(passwordRequirementsList, passwordStrength.nextSibling)
      }
  
      // Create confirm password match indicator if it doesn't exist
      if (!document.querySelector(".password-match-indicator")) {
        const passwordMatchIndicator = document.createElement("div")
        passwordMatchIndicator.className = "password-match-indicator mt-1"
        passwordMatchIndicator.style.fontSize = "0.8rem"
        passwordMatchIndicator.style.display = "none"
        confirmPassword.parentNode.appendChild(passwordMatchIndicator)
      }
  
      // Password visibility toggle functionality
      if (passwordToggle) {
        passwordToggle.addEventListener("click", () => {
          togglePasswordVisibility(password, passwordToggle)
        })
      }
  
      if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener("click", () => {
          togglePasswordVisibility(confirmPassword, confirmPasswordToggle)
        })
      }
  
      // First name validation
      if (firstName) {
        firstName.addEventListener("input", () => {
          validateField(firstName, patterns.name, "Please enter a valid first name (at least 2 characters, letters only)")
        })
      }
  
      // Last name validation
      if (lastName) {
        lastName.addEventListener("input", () => {
          validateField(lastName, patterns.name, "Please enter a valid last name (at least 2 characters, letters only)")
        })
      }
  
      // Email validation
      if (email) {
        email.addEventListener("input", () => {
          validateField(email, patterns.email, "Please enter a valid email address")
        })
      }
  
      // Password strength checker
      if (password) {
        password.addEventListener("input", () => {
          const value = password.value
          let strength = 0
  
          // Check each requirement and update the list
          const reqLength = document.getElementById("req-length")
          const reqNumber = document.getElementById("req-number")
          const reqSpecial = document.getElementById("req-special")
  
          // Check length
          if (value.length >= patterns.password.minLength) {
            reqLength.className = "text-success"
            reqLength.innerHTML = '<i class="fa fa-check"></i> At least 8 characters'
            strength += 1
          } else {
            reqLength.className = "text-danger"
            reqLength.innerHTML = "At least 8 characters"
          }
  
          // Check number
          if (patterns.password.hasNumber.test(value)) {
            reqNumber.className = "text-success"
            reqNumber.innerHTML = '<i class="fa fa-check"></i> At least one number'
            strength += 1
          } else {
            reqNumber.className = "text-danger"
            reqNumber.innerHTML = "At least one number"
          }
  
          // Check special character
          if (patterns.password.hasSpecial.test(value)) {
            reqSpecial.className = "text-success"
            reqSpecial.innerHTML = '<i class="fa fa-check"></i> At least one special character'
            strength += 1
          } else {
            reqSpecial.className = "text-danger"
            reqSpecial.innerHTML = "At least one special character"
          }
  
          // Update strength indicator color and width
          updatePasswordStrength(passwordStrength, strength)
  
          // Check if confirm password is filled and update match indicator
          if (confirmPassword && confirmPassword.value) {
            checkPasswordMatch(password, confirmPassword)
          }
        })
      }
  
      // Real-time validation for confirm password
      if (confirmPassword) {
        confirmPassword.addEventListener("input", () => {
          checkPasswordMatch(password, confirmPassword)
        })
      }
  
      // Form submission
      signupForm.addEventListener("submit", (event) => {
        event.preventDefault()
  
        // Reset validation state
        resetValidationState(signupForm)
  
        // Validate all fields
        let isValid = true
  
        // First Name validation
        if (
          firstName &&
          !validateField(
            firstName,
            patterns.name,
            "Please enter a valid first name (at least 2 characters, letters only)",
          )
        ) {
          isValid = false
        }
  
        // Last Name validation
        if (
          lastName &&
          !validateField(lastName, patterns.name, "Please enter a valid last name (at least 2 characters, letters only)")
        ) {
          isValid = false
        }
  
        // Email validation
        if (email && !validateField(email, patterns.email, "Please enter a valid email address")) {
          isValid = false
        }
  
        // Password validation
        if (password) {
          const passwordValid = validatePassword(password.value)
          if (!passwordValid.valid) {
            setInvalidState(password, passwordValid.message)
            isValid = false
          }
        }
  
        // Confirm Password validation
        if (password && confirmPassword && password.value !== confirmPassword.value) {
          setInvalidState(confirmPassword, "Passwords do not match")
          isValid = false
        }
  
        // Terms checkbox validation
        if (termsCheck && !termsCheck.checked) {
          setInvalidState(termsCheck, "You must agree to the terms to continue")
          isValid = false
        }
  
        // If all validations pass, show success modal
        if (isValid) {
          // You can submit the form to server here
          // For demo purposes, we'll just show the success modal
          const successModalElement = document.getElementById("successModal")
          if (successModalElement) {
            const successModal = new bootstrap.Modal(successModalElement)
            successModal.show()
  
            // Reset form after successful submission
            signupForm.reset()
            if (passwordStrength) {
              passwordStrength.style.width = "0%"
              passwordStrength.style.backgroundColor = ""
            }
  
            // Reset password requirements
            document.querySelectorAll(".password-requirements li").forEach((item) => {
              item.className = "text-danger"
              item.innerHTML = item.innerHTML.replace('<i class="fa fa-check"></i> ', "")
            })
  
            // Hide password match indicator
            const passwordMatchIndicator = document.querySelector(".password-match-indicator")
            if (passwordMatchIndicator) {
              passwordMatchIndicator.style.display = "none"
            }
          }
        }
      })
  
      // Login link functionality
      const loginLink = document.getElementById("loginLink")
      if (loginLink) {
        loginLink.addEventListener("click", (e) => {
          e.preventDefault()
          window.location.href = "login.html"
        })
      }
    }
  
    // ==================== LOGIN FORM VALIDATION ====================
    const loginForm = document.getElementById("loginForm")
    if (loginForm) {
      const loginEmail = document.getElementById("loginEmail")
      const loginPassword = document.getElementById("loginPassword")
      const loginPasswordToggle = document.getElementById("loginPasswordToggle")
      const rememberCheck = document.getElementById("rememberCheck")
  
      // Password visibility toggle functionality
      if (loginPasswordToggle) {
        loginPasswordToggle.addEventListener("click", () => {
          togglePasswordVisibility(loginPassword, loginPasswordToggle)
        })
      }
  
      // Email validation
      if (loginEmail) {
        loginEmail.addEventListener("input", () => {
          validateField(loginEmail, patterns.email, "Please enter a valid email address")
        })
      }
  
      // Form submission
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault()
  
        // Reset validation state
        resetValidationState(loginForm)
  
        // Validate all fields
        let isValid = true
  
        // Email validation
        if (loginEmail && !validateField(loginEmail, patterns.email, "Please enter a valid email address")) {
          isValid = false
        }
  
        // Password validation - just check if it's not empty for login
        if (loginPassword && !loginPassword.value.trim()) {
          setInvalidState(loginPassword, "Please enter your password")
          isValid = false
        }
  
        // If all validations pass, show success modal
        if (isValid) {
          // You would typically send this data to your server for authentication
          // For demo purposes, we'll just show the success modal
          const loginSuccessModalElement = document.getElementById("loginSuccessModal")
          if (loginSuccessModalElement) {
            const loginSuccessModal = new bootstrap.Modal(loginSuccessModalElement)
            loginSuccessModal.show()
  
            // Save email in localStorage if "Remember me" is checked
            if (rememberCheck && rememberCheck.checked) {
              localStorage.setItem("rememberedEmail", loginEmail.value)
            } else {
              localStorage.removeItem("rememberedEmail")
            }
  
            // Reset form after successful submission
            loginForm.reset()
          }
        }
      })
  
      // Check if there's a remembered email and populate the field
      if (loginEmail) {
        const rememberedEmail = localStorage.getItem("rememberedEmail")
        if (rememberedEmail) {
          loginEmail.value = rememberedEmail
          if (rememberCheck) {
            rememberCheck.checked = true
          }
        }
      }
  
      // Forgot password link functionality
      const forgotPasswordLink = document.querySelector(".forgot-password-link")
      if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
          e.preventDefault()
          window.location.href = "forgot-password.html"
        })
      }
    }
  
    // ==================== FORGOT PASSWORD FORM VALIDATION ====================
    const forgotPasswordForm = document.getElementById("forgotPasswordForm")
    if (forgotPasswordForm) {
      const resetEmail = document.getElementById("resetEmail")
  
      // Email validation
      if (resetEmail) {
        resetEmail.addEventListener("input", () => {
          validateField(resetEmail, patterns.email, "Please enter a valid email address")
        })
      }
  
      // Form submission
      forgotPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault()
  
        // Reset validation state
        resetValidationState(forgotPasswordForm)
  
        // Validate email
        let isValid = true
        if (resetEmail && !validateField(resetEmail, patterns.email, "Please enter a valid email address")) {
          isValid = false
        }
  
        // If validation passes, show the email sent modal
        if (isValid) {
          const resetEmailSentModalElement = document.getElementById("resetEmailSentModal")
          if (resetEmailSentModalElement) {
            const resetEmailSentModal = new bootstrap.Modal(resetEmailSentModalElement)
            resetEmailSentModal.show()
  
            // For demo purposes, we'll also show the reset password modal after a delay
            setTimeout(() => {
              resetEmailSentModal.hide()
              const resetPasswordModalElement = document.getElementById("resetPasswordModal")
              if (resetPasswordModalElement) {
                const resetPasswordModal = new bootstrap.Modal(resetPasswordModalElement)
                resetPasswordModal.show()
              }
            }, 3000)
  
            // Reset form
            forgotPasswordForm.reset()
          }
        }
      })
    }
  
    // ==================== RESET PASSWORD FORM VALIDATION ====================
    const resetPasswordForm = document.getElementById("resetPasswordForm")
    if (resetPasswordForm) {
      const newPassword = document.getElementById("newPassword")
      const confirmNewPassword = document.getElementById("confirmNewPassword")
      const newPasswordToggle = document.getElementById("newPasswordToggle")
      const confirmNewPasswordToggle = document.getElementById("confirmNewPasswordToggle")
      const newPasswordStrength = document.getElementById("newPasswordStrength")
      const saveNewPasswordBtn = document.getElementById("saveNewPasswordBtn")
  
      // Password visibility toggle functionality
      if (newPasswordToggle) {
        newPasswordToggle.addEventListener("click", () => {
          togglePasswordVisibility(newPassword, newPasswordToggle)
        })
      }
  
      if (confirmNewPasswordToggle) {
        confirmNewPasswordToggle.addEventListener("click", () => {
          togglePasswordVisibility(confirmNewPassword, confirmNewPasswordToggle)
        })
      }
  
      // Password strength checker
      if (newPassword) {
        newPassword.addEventListener("input", () => {
          const value = newPassword.value
          let strength = 0
  
          // Check each requirement and update the list
          const reqLength = document.getElementById("reset-req-length")
          const reqNumber = document.getElementById("reset-req-number")
          const reqSpecial = document.getElementById("reset-req-special")
  
          // Check length
          if (value.length >= patterns.password.minLength) {
            reqLength.className = "text-success"
            reqLength.innerHTML = '<i class="fa fa-check"></i> At least 8 characters'
            strength += 1
          } else {
            reqLength.className = "text-danger"
            reqLength.innerHTML = "At least 8 characters"
          }
  
          // Check number
          if (patterns.password.hasNumber.test(value)) {
            reqNumber.className = "text-success"
            reqNumber.innerHTML = '<i class="fa fa-check"></i> At least one number'
            strength += 1
          } else {
            reqNumber.className = "text-danger"
            reqNumber.innerHTML = "At least one number"
          }
  
          // Check special character
          if (patterns.password.hasSpecial.test(value)) {
            reqSpecial.className = "text-success"
            reqSpecial.innerHTML = '<i class="fa fa-check"></i> At least one special character'
            strength += 1
          } else {
            reqSpecial.className = "text-danger"
            reqSpecial.innerHTML = "At least one special character"
          }
  
          // Update strength indicator color and width
          updatePasswordStrength(newPasswordStrength, strength)
  
          // Check if confirm password is filled and update match indicator
          if (confirmNewPassword && confirmNewPassword.value) {
            checkPasswordMatch(newPassword, confirmNewPassword)
          }
        })
      }
  
      // Real-time validation for confirm password
      if (confirmNewPassword) {
        confirmNewPassword.addEventListener("input", () => {
          checkPasswordMatch(newPassword, confirmNewPassword)
        })
      }
  
      // Save new password button click handler
      if (saveNewPasswordBtn) {
        saveNewPasswordBtn.addEventListener("click", () => {
          // Reset validation state
          resetValidationState(resetPasswordForm)
  
          // Validate password fields
          let isValid = true
  
          // New Password validation
          if (newPassword) {
            const passwordValid = validatePassword(newPassword.value)
            if (!passwordValid.valid) {
              setInvalidState(newPassword, passwordValid.message)
              isValid = false
            }
          }
  
          // Confirm Password validation
          if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
            setInvalidState(confirmNewPassword, "Passwords do not match")
            isValid = false
          }
  
          // If all validations pass, show success modal
          if (isValid) {
            // Hide the reset password modal
            const resetPasswordModalElement = document.getElementById("resetPasswordModal")
            if (resetPasswordModalElement) {
              const resetPasswordModal = bootstrap.Modal.getInstance(resetPasswordModalElement)
              resetPasswordModal.hide()
            }
  
            // Show the password reset success modal
            const passwordResetSuccessModalElement = document.getElementById("passwordResetSuccessModal")
            if (passwordResetSuccessModalElement) {
              const passwordResetSuccessModal = new bootstrap.Modal(passwordResetSuccessModalElement)
              passwordResetSuccessModal.show()
            }
  
            // Reset form
            resetPasswordForm.reset()
  
            // Reset password requirements
            document.querySelectorAll("#resetPasswordForm .password-requirements li").forEach((item) => {
              item.className = "text-danger"
              item.innerHTML = item.innerHTML.replace('<i class="fa fa-check"></i> ', "")
            })
  
            // Reset password strength indicator
            if (newPasswordStrength) {
              newPasswordStrength.style.width = "0%"
              newPasswordStrength.style.backgroundColor = ""
            }
  
            // Hide password match indicator
            const passwordMatchIndicator = document.querySelector("#resetPasswordForm .password-match-indicator")
            if (passwordMatchIndicator) {
              passwordMatchIndicator.style.display = "none"
            }
          }
        })
      }
    }
  })
  
  