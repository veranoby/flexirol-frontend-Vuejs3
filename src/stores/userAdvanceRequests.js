// State
const userRequests = ref([])
const availableAmount = ref(0)
const companyConfig = ref({})
const loading = ref(false)
const error = ref(null)

// Actions
async function fetchUserRequests(userId)
async function createAdvanceRequest(requestData)
async function fetchUserAvailableAmount(userId)
async function validateRequestLimits(userId, requestedAmount)

// Getters
const pendingRequests = computed(() => ...)
const processedRequests = computed(() => ...)
const canRequestAdvance = computed(() => ...)
