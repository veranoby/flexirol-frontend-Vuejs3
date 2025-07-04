// State
const users = ref([])
const companies = ref([])
const loading = ref(false)
const error = ref(null)

// Actions
async function fetchUsersByRole(role, companyId = null)
async function createUser(userData)
async function updateUser(userId, userData)
async function deleteUser(userId)
async function toggleUserStatus(userId)
async function bulkCreateUsers(usersArray)

// Getters
const activeUsers = computed(() => ...)
const usersByCompany = computed(() => ...)
const userStats = computed(() => ...)
