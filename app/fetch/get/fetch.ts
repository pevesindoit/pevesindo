import axios from "axios";

export const getAllSj = async (data: any) => {
  try {
    const res = await axios.post("/api/no-sj", { data });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getSjDetail = async (id: any) => {
  try {
    const res = await axios.post("/api/sj-detail", id);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getCustomer = async (id: any) => {
  try {
    const res = await axios.post("/api/custumer-detail", id);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getSync = async (data: any) => {
  try {
    const res = await axios.post("/api/sync-database", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getSyncMutation = async (data: any) => {
  try {
    const res = await axios.post("/api/sync-mutasi", { data });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getDriver = async () => {
  try {
    const res = await axios.get("/api/get-driver");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getProducts = async (id: number) => {
  try {
    const res = await axios.post("/api/get-stock", id);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const searchProducts = async (keywords: string) => {
  try {
    const res = await axios.post("/api/search-stock", { keywords });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getDetailProduct = async (id: number) => {
  try {
    const res = await axios.post("/api/stock-detail", { id });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getLink = async (data: any) => {
  try {
    const res = await axios.post("/api/get-location-link", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
