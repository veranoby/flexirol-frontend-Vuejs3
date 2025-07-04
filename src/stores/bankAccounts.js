// State
const bankAccounts = ref([])
const loading = ref(false)
const error = ref(null)

// Actions
async function fetchUserBankAccounts(userId)
async function createBankAccount(accountData)
async function updateBankAccount(accountId, accountData)
async function deleteBankAccount(accountId)
async function toggleAccountStatus(accountId)

// Getters
const activeBankAccounts = computed(() => ...)
const inactiveBankAccounts = computed(() => ...)
