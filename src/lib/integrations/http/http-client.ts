export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export class RealHttpClient implements HttpClient {
  async request<T>(method: string, url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };
    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, fetchOptions);
    const data = await res.json().catch(() => ({}));
    return {
      data,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  get<T>(url: string, options?: HttpRequestOptions) { return this.request<T>('GET', url, options); }
  post<T>(url: string, options?: HttpRequestOptions) { return this.request<T>('POST', url, options); }
  put<T>(url: string, options?: HttpRequestOptions) { return this.request<T>('PUT', url, options); }
  patch<T>(url: string, options?: HttpRequestOptions) { return this.request<T>('PATCH', url, options); }
  delete<T>(url: string, options?: HttpRequestOptions) { return this.request<T>('DELETE', url, options); }
}

export class MockHttpClient implements HttpClient {
  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return { data: {} as T, status: 200, headers: {} };
  }
  async post<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return { data: { id: Math.floor(Math.random() * 10000) } as any, status: 201, headers: {} };
  }
  async put<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return { data: {} as T, status: 200, headers: {} };
  }
  async patch<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return { data: {} as T, status: 200, headers: {} };
  }
  async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return { data: {} as T, status: 200, headers: {} };
  }
}
