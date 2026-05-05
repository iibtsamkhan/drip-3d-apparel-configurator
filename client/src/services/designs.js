const SERVER_BASE_URL = String(
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const DESIGNS_ENDPOINT = `${SERVER_BASE_URL}/api/v1/designs`;

const createHeaders = async (getToken) => {
  const token = await getToken();
  if (!token) {
    throw new Error("Missing session token.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session expired. Refresh the page and sign in again.");
    }
    throw new Error(payload?.message || `Request failed with HTTP ${response.status}`);
  }

  return payload;
};

export const listSavedDesigns = async (getToken) => {
  const token = await getToken();
  if (!token) {
    throw new Error("Missing session token.");
  }

  const response = await fetch(DESIGNS_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

export const getSavedDesign = async (designId, getToken) => {
  const token = await getToken();
  if (!token) {
    throw new Error("Missing session token.");
  }

  const response = await fetch(`${DESIGNS_ENDPOINT}/${designId}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

export const saveDesign = async (payload, getToken) => {
  const response = await fetch(DESIGNS_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    headers: await createHeaders(getToken),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};
