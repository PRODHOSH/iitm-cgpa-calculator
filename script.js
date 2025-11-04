// ==================== GLOBAL STATE ====================
let currentStep = 1;
let courses = [];
let tempCourse = {};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateStepUI();
});

// ==================== THEME MANAGEMENT ====================
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// ==================== STEP NAVIGATION ====================
function goToStep(step) {
    // Moving forward - validate current step
    if (step > currentStep) {
        if (currentStep === 1) {
            if (!validateStep1()) return;
        }
        if (currentStep === 2) {
            saveAssignments();
        }
    }

    currentStep = step;
    updateStepUI();
}

function updateStepUI() {
    // Show/hide steps
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === currentStep);
    });

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            el.classList.add('active');
        } else if (index + 1 < currentStep) {
            el.classList.add('completed');
        }
    });

    // Refresh course list on step 4
    if (currentStep === 4) {
        displayCourseList();
    }
}

// ==================== VALIDATION ====================
function validateStep1() {
    const name = document.getElementById('courseName').value.trim();
    const credits = parseInt(document.getElementById('credits').value);

    if (!name) {
        showNotification('❌ Please enter a course name', 'error');
        return false;
    }

    if (!credits || credits < 1 || credits > 10) {
        showNotification('❌ Credits must be between 1 and 10', 'error');
        return false;
    }

    // Save to temp storage
    tempCourse.name = name;
    tempCourse.credits = credits;
    return true;
}

function saveAssignments() {
    const assignmentInputs = document.querySelectorAll('.assignment');
    const assignments = [];
    
    assignmentInputs.forEach(input => {
        const val = parseFloat(input.value);
        assignments.push(isNaN(val) ? 0 : val);
    });
    
    tempCourse.assignments = assignments;
}

// ==================== ADD COURSE ====================
function addCourse() {
    console.log('=== ADD COURSE CLICKED ===');
    console.log('tempCourse:', tempCourse);
    
    // Get exam values
    const quiz1Val = document.getElementById('quiz1').value;
    const quiz2Val = document.getElementById('quiz2').value;
    const finalExamVal = document.getElementById('finalExam').value;
    
    console.log('Quiz1:', quiz1Val, 'Quiz2:', quiz2Val, 'Final:', finalExamVal);
    
    // Parse values
    const quiz1 = parseFloat(quiz1Val);
    const quiz2 = parseFloat(quiz2Val);
    const finalExam = parseFloat(finalExamVal);
    
    // Validate exam scores
    if (isNaN(quiz1) || isNaN(quiz2) || isNaN(finalExam)) {
        showNotification('❌ Please enter all exam scores', 'error');
        return;
    }
    
    if (quiz1 < 0 || quiz1 > 100 || quiz2 < 0 || quiz2 > 100 || finalExam < 0 || finalExam > 100) {
        showNotification('❌ Scores must be between 0 and 100', 'error');
        return;
    }
    
    // Save exam scores
    tempCourse.quiz1 = quiz1;
    tempCourse.quiz2 = quiz2;
    tempCourse.finalExam = finalExam;
    
    // Ensure assignments are saved
    if (!tempCourse.assignments || tempCourse.assignments.length === 0) {
        saveAssignments();
    }
    
    // Verify we have all data
    if (!tempCourse.name || !tempCourse.credits) {
        showNotification('❌ Missing course info. Start from Step 1.', 'error');
        goToStep(1);
        return;
    }
    
    console.log('All validation passed. Calculating...');
    
    // Calculate score
    const avgAssignment = tempCourse.assignments.reduce((a, b) => a + b, 0) / 10;
    const formula1 = (0.1 * avgAssignment) + (0.2 * Math.max(quiz1, quiz2)) + (0.6 * finalExam);
    const formula2 = (0.1 * avgAssignment) + (0.2 * quiz1) + (0.3 * quiz2) + (0.4 * finalExam);
    const totalScore = Math.max(formula1, formula2);
    
    const gradeInfo = getGradeInfo(totalScore);
    
    // Add to courses array
    courses.push({
        name: tempCourse.name,
        credits: tempCourse.credits,
        assignments: tempCourse.assignments,
        quiz1: quiz1,
        quiz2: quiz2,
        finalExam: finalExam,
        avgAssignment: avgAssignment.toFixed(1),
        totalScore: totalScore.toFixed(2),
        grade: gradeInfo.grade,
        points: gradeInfo.points
    });
    
    console.log('Course added:', courses[courses.length - 1]);
    
    showNotification('✅ Course added successfully!', 'success');
    clearForm();
    goToStep(4);
}

function getGradeInfo(score) {
    if (score >= 90) return { grade: 'S', points: 10 };
    if (score >= 80) return { grade: 'A', points: 9 };
    if (score >= 70) return { grade: 'B', points: 8 };
    if (score >= 60) return { grade: 'C', points: 7 };
    if (score >= 50) return { grade: 'D', points: 6 };
    if (score >= 40) return { grade: 'E', points: 5 };
    return { grade: 'F', points: 0 };
}

function displayCourseList() {
    const container = document.getElementById('courseList');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>No courses added yet. Add your first course to get started!</p>
            </div>
        `;
        document.getElementById('calculateBtn').disabled = true;
    } else {
        container.innerHTML = courses.map((course, index) => `
            <div class="course-card">
                <div class="course-info">
                    <h3>${course.name}</h3>
                    <div class="course-details">
                        Credits: ${course.credits} | Score: ${course.totalScore} | Grade Points: ${course.points}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="grade-pill">${course.grade}</span>
                    <button class="delete-btn" onclick="deleteCourse(${index})" title="Delete course">×</button>
                </div>
            </div>
        `).join('');
        document.getElementById('calculateBtn').disabled = false;
    }
}

function deleteCourse(index) {
    const courseName = courses[index].name;
    if (confirm(`Are you sure you want to delete "${courseName}"?`)) {
        courses.splice(index, 1);
        displayCourseList();
        showNotification('🗑️ Course removed', 'success');
    }
}

function clearForm() {
    document.getElementById('courseName').value = '';
    document.getElementById('credits').value = '';
    document.querySelectorAll('.assignment').forEach(input => input.value = '');
    document.getElementById('quiz1').value = '';
    document.getElementById('quiz2').value = '';
    document.getElementById('finalExam').value = '';
    tempCourse = {};
}

// Calculate CGPA
function calculateCGPA() {
    if (courses.length === 0) {
        showNotification('Please add at least one course', 'error');
        return;
    }

    let totalGradePoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
        totalGradePoints += course.points * course.credits;
        totalCredits += course.credits;
    });

    const cgpa = (totalGradePoints / totalCredits).toFixed(2);
    const cgpaGrade = getGradeInfo(cgpa * 10).grade;

    // Populate results
    document.getElementById('finalCGPA').textContent = cgpa;
    document.getElementById('cgpaGrade').textContent = `Grade: ${cgpaGrade}`;
    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('totalCredits').textContent = totalCredits;
    
    const avgPoints = (courses.reduce((sum, c) => sum + c.points, 0) / courses.length).toFixed(1);
    document.getElementById('avgPoints').textContent = avgPoints;

    // Populate table
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = courses.map(course => `
        <tr>
            <td>${course.name}</td>
            <td>${course.credits}</td>
            <td>${course.totalScore}</td>
            <td><span class="grade-pill">${course.grade}</span></td>
            <td>${course.points}</td>
        </tr>
    `).join('');

    // Show modal
    document.getElementById('resultsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Animate CGPA
    animateCGPA(parseFloat(cgpa));
}

function animateCGPA(target) {
    const element = document.getElementById('finalCGPA');
    let current = 0;
    const increment = target / 50;
    const duration = 1000; // 1 second
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(2);
    }, stepTime);
}

function closeModal() {
    document.getElementById('resultsModal').classList.remove('active');
    document.body.style.overflow = '';
}

function resetCalculator() {
    if (courses.length === 0) {
        showNotification('Calculator is already empty', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to start over? All data will be lost.')) {
        courses = [];
        tempCourse = {};
        currentStep = 1;
        clearForm();
        updateStepUI();
        closeModal();
        showNotification('🔄 Calculator reset successfully', 'success');
    }
}

// Notifications
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#00ff88' : '#ff3366';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 16px 24px;
        background: ${bgColor};
        color: #000;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('resultsModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('resultsModal');
        if (modal.classList.contains('active')) {
            closeModal();
        }
    }
});
