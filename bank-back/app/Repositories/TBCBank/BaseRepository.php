<?php

/**
 * Created by PhpStorm.
 * User: Admin
 * Date: 23.04.2019
 * Time: 18:02
 */

namespace App\Repositories\TBCBank;


use App\Models\TbcPassword;

class BaseRepository
{
    protected $id;
    protected $password;
    protected $baseUrl;
    protected $bankNameId;

    /**
     * StatementRepository constructor.
     */
    public function __construct($bankNameId = 1)
    {
        $this->id = $bankNameId == 2 ? env("TBC_ANTA_ID") : env("TBC_GORGIA_ID");
        $this->password = $this->getCurrentPassword($bankNameId);
        $this->baseUrl = env('TBC_API_URL');
        $this->bankNameId = $bankNameId;
    }

    private function getCurrentPassword($bankNameId)
    {
        return TbcPassword::where('bank_id', $bankNameId)->latest()->firstOrFail()->password;
    }

    protected function getAuthenticationBody()
    {
        return '<wsse:UsernameToken>
              <wsse:Username>' . $this->id . '</wsse:Username>
              <wsse:Password>' . $this->password . '</wsse:Password>
            </wsse:UsernameToken>';
    }

    public function responseAsObject($response)
    {
        $cleanXml = str_ireplace(['SOAP-ENV:', 'SOAP:', 'ns2:', ' xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"', ' xmlns:ns2="http://www.mygemini.com/schemas/mygemini"'], '', $response);
        $object = simplexml_load_string($cleanXml);

        return json_decode(json_encode($object));
    }

    protected function getHeaders()
    {
        return [
            'Content-Type: text/xml'
        ];
    }
}
