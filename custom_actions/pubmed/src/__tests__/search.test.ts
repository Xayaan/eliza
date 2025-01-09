import { searchPubMed } from '../utils/search';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('searchPubMed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no results found', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { esearchresult: { idlist: [] } }
    });

    const results = await searchPubMed('nonexistent research');
    expect(results).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should return formatted articles when results found', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          esearchresult: {
            idlist: ['12345']
          }
        }
      })
      .mockResolvedValueOnce({
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <eSummaryResult>
          <DocSum>
            <Id>12345</Id>
            <Item Name="Title">Test Article Title</Item>
            <Item Name="Abstract">Test Abstract</Item>
            <Item Name="Source">Test Journal</Item>
            <Item Name="PubDate">2023 Jan</Item>
            <Item Name="Author">Author1, Author2</Item>
          </DocSum>
        </eSummaryResult>`
      });

    const results = await searchPubMed('test research');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: expect.any(String),
      abstract: expect.any(String),
      url: expect.stringContaining('12345'),
      pmid: '12345',
      journal: expect.any(String),
      year: expect.any(String),
      authors: expect.any(Array)
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    await expect(searchPubMed('error test')).rejects.toThrow('API Error');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});