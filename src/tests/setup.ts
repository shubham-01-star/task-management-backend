import axios from 'axios';

jest.doMock('redis', () => ({
    createClient: () => ({
        on: jest.fn(),
        connect: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
    })
}));

jest.mock('axios');

beforeAll(() => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.post.mockResolvedValue({ data: {} });
});
