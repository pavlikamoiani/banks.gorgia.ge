<?php

namespace App\Services\TBC;

use Illuminate\Support\Facades\Log;

class TBCService
{
    private $id;
    private $password;
    private $baseUrl;

    public function __construct()
    {
        $this->id = env('TBC_ID');
        $this->password = env('TBC_PASSWORD');
        $this->baseUrl = env('TBC_BASE_URL');
    }

    public function getAllAccountMovements($periodFrom, $periodTo)
    {
        $allMovements = [];
        $pageIndex = 1;
        $pageSize = 700;

        do {
            $soapBody = $this->buildSoapRequest($periodFrom, $periodTo, $pageIndex, $pageSize);
            $headers = [
                'Content-Type: text/xml; charset=utf-8',
                'SOAPAction: "http://www.mygemini.com/schemas/mygemini/GetAccountMovements"',
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $soapBody);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, true);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($response === false) {
                Log::error('TBC SOAP: No response from server');
                throw new \Exception('No response from TBC server');
            }

            $headerSize = strpos($response, "\r\n\r\n");
            $body = $headerSize !== false ? substr($response, $headerSize + 4) : $response;

            if ($httpCode < 200 || $httpCode >= 300) {
                Log::error('TBC SOAP: HTTP error', ['http_code' => $httpCode, 'body' => $body]);
                throw new \Exception('TBC SOAP HTTP error: ' . $httpCode);
            }

            if (stripos($body, '<html') !== false || stripos($body, '<body') !== false) {
                Log::error('TBC SOAP: HTML error response', ['body' => $body]);
                throw new \Exception('TBC SOAP returned HTML error page');
            }

            $xml = @simplexml_load_string($body);
            if ($xml === false) {
                Log::error('TBC SOAP: Invalid XML response', ['body' => $body]);
                throw new \Exception('TBC SOAP invalid XML response');
            }
            $json = json_decode(json_encode($xml), true);

            $movements = $json['SOAP-ENV:Body']['ns2:GetAccountMovementsResponseIo']['ns2:accountMovement'] ?? [];
            if (isset($movements['ns2:movementId'])) {
                $movements = [$movements];
            }
            $allMovements = array_merge($allMovements, $movements);

            $result = $json['SOAP-ENV:Body']['ns2:GetAccountMovementsResponseIo']['ns2:result'] ?? [];
            $totalCount = $result['ns2:totalCount'] ?? 0;
            $pageIndex++;
        } while ($pageIndex * $pageSize < $totalCount);

        return $allMovements;
    }

    private function buildSoapRequest($periodFrom, $periodTo, $pageIndex, $pageSize)
    {
        return '
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:myg="http://www.mygemini.com/schemas/mygemini" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
            <soapenv:Header>
                <wsse:Security>
                <wsse:UsernameToken>
                    <wsse:Username>' . $this->id . '</wsse:Username>
                    <wsse:Password>' . $this->password . '</wsse:Password>
                </wsse:UsernameToken>
                </wsse:Security>
            </soapenv:Header>
            <soapenv:Body>
                <myg:GetAccountMovementsRequestIo>
                <myg:accountMovementFilterIo>
                    <myg:pager>
                    <myg:pageIndex>' . $pageIndex . '</myg:pageIndex>
                    <myg:pageSize>' . $pageSize . '</myg:pageSize>
                    </myg:pager>
                    <myg:periodFrom>' . $periodFrom . '</myg:periodFrom>
                    <myg:periodTo>' . $periodTo . '</myg:periodTo>
                </myg:accountMovementFilterIo>
                </myg:GetAccountMovementsRequestIo>
            </soapenv:Body>
            </soapenv:Envelope>
        ';
    }

    private function parseMovementsResponse($xml)
    {
        if (!$xml) return [];
        $result = [];
        try {
            $sxe = simplexml_load_string($xml, null, 0, 'http://schemas.xmlsoap.org/soap/envelope/');
            $body = $sxe->children('http://schemas.xmlsoap.org/soap/envelope/')->Body;
            $ns2 = $body->children('http://www.mygemini.com/schemas/mygemini');
            $movements = $ns2->GetAccountMovementsResponseIo->accountMovement;
            foreach ($movements as $m) {
                $result[] = json_decode(json_encode($m), true);
            }
        } catch (\Exception $e) {
            Log::error('TBC SOAP parse error: ' . $e->getMessage());
        }
        return $result;
    }
}
