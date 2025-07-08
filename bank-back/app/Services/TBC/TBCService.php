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

    public function getAccountMovements($accountNumber, $currency, $periodFrom, $periodTo, $pageIndex = 0, $pageSize = 700)
    {
        $soapBody = $this->buildSoapRequest($accountNumber, $currency, $periodFrom, $periodTo, $pageIndex, $pageSize);
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
        $response = curl_exec($ch);
        if (curl_error($ch)) {
            Log::error('TBC SOAP error: ' . curl_error($ch));
        }
        curl_close($ch);
        Log::debug('TBC SOAP request: ' . $soapBody);
        Log::debug('TBC SOAP response: ' . $response);
        return $this->parseMovementsResponse($response);
    }

    private function buildSoapRequest($accountNumber, $currency, $periodFrom, $periodTo, $pageIndex, $pageSize)
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            . '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"'
            . ' xmlns:myg="http://www.mygemini.com/schemas/mygemini"'
            . ' xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">'
            . '<soapenv:Header>'
            . '<wsse:Security>'
            . '<wsse:UsernameToken>'
            . '<wsse:Username>' . $this->id . '</wsse:Username>'
            . '<wsse:Password>' . $this->password . '</wsse:Password>'
            . '<wsse:Nonce>111111</wsse:Nonce>'
            . '</wsse:UsernameToken>'
            . '</wsse:Security>'
            . '</soapenv:Header>'
            . '<soapenv:Body>'
            . '<myg:GetAccountMovementsRequestIo>'
            . '<myg:accountMovementFilterIo>'
            . '<myg:pager>'
            . '<myg:pageIndex>' . $pageIndex . '</myg:pageIndex>'
            . '<myg:pageSize>' . $pageSize . '</myg:pageSize>'
            . '</myg:pager>'
            . '<myg:accountNumber>' . $accountNumber . '</myg:accountNumber>'
            . '<myg:accountCurrencyCode>' . $currency . '</myg:accountCurrencyCode>'
            . '<myg:periodFrom>' . $periodFrom . '</myg:periodFrom>'
            . '<myg:periodTo>' . $periodTo . '</myg:periodTo>'
            . '</myg:accountMovementFilterIo>'
            . '</myg:GetAccountMovementsRequestIo>'
            . '</soapenv:Body>'
            . '</soapenv:Envelope>';
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
